/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ConfigService } from 'ngx-config-json';
import { environment } from '../environments/environment';
import { NbOAuth2AuthStrategy, NbOAuth2ClientAuthMethod, NbOAuth2GrantType, NbOAuth2ResponseType, NbAuthService } from '@nebular/auth';
import { OidcJWTToken } from './pages/auth/oidc/oidc';
import { NbPasswordAuthStrategy } from './@theme/components/auth/public_api';
import { Router, NavigationStart, Event as RouterEvent } from '@angular/router';
import { SharedService, SSOMessage } from './pages/services/shared.service';
import { filter, Subscription } from 'rxjs';

/*
Central component that initializes the app
Listens for SSO tokens via postMessage
Handles route changes and redirections
Checks for existing tokens on startup
*/

@Component({
  selector: 'ngx-app',
  template: '<router-outlet></router-outlet>',
})
export class AppComponent implements OnInit, OnDestroy {
  private messageEventListener: (event: MessageEvent) => void;
  private routerSubscription: Subscription;

  constructor(
    private oauthStrategy: NbOAuth2AuthStrategy,
    private oauthStrategyPwd: NbPasswordAuthStrategy,
    private config: ConfigService<Record<string, any>>,
    private router: Router,
    private sharedService: SharedService,
    private authService: NbAuthService,
  ) {
    // Setup postMessage listener for SSO as early as possible
    this.setupPostMessageListener();

    if (this.config.config["authenticationMethod"].toLowerCase() === "keycloak") {
     
      oauthStrategy.setOptions({
        name: environment.authProfile,
        clientId: environment.client_id,
        clientSecret: environment.client_secret,
        baseEndpoint: `${this.config.config["keyCloakBaseURL"]}/auth/realms/${environment.idmRealmName}/protocol/openid-connect`,
        clientAuthMethod: NbOAuth2ClientAuthMethod.NONE,
        token: {
          endpoint: '/token',
          redirectUri: `${this.config.config["dashboardBaseURL"]}/keycloak-auth/callback`,
          class: OidcJWTToken,
        },
        authorize: {
          endpoint: '/auth',
          scope: 'openid',
          redirectUri: `${this.config.config["dashboardBaseURL"]}/keycloak-auth/callback`,
          responseType: NbOAuth2ResponseType.CODE
        },
        redirect: {
          success: '/pages',
          failure: null,
        },
        refresh: {
          endpoint: '/token',
          grantType: NbOAuth2GrantType.REFRESH_TOKEN,
          scope:'openid'
        } 
      });
    }else{
      oauthStrategyPwd.setOptions({name: 'email',
      baseEndpoint: this.config.config["idra_base_url"] + '/Idra/api/v1/administration',
      login: {
        alwaysFail: false,
        endpoint: '/login',
        method: 'post',
        redirect: {
          success: '/pages/administration/adminCatalogues',
          failure: '/pages/auth/login',
        },
        defaultErrors: ['Username/password combination is not correct, please try again.'],
        defaultMessages: ['You have been successfully logged in.'],
      },
      logout: {
        alwaysFail: false,
        endpoint: '/logout',
        method: 'post',
        redirect: {
          success: '/pages/auth/login',
          failure: '/pages/auth/login',
        },
      },
      });
    }  
  }

  ngOnInit() {
    // Check for embedded parameter in URL
    const embeddedParam = this.getUrlParameter('embedded');
    
    const isEmbedded = embeddedParam === 'true';
    this.sharedService.updateEmbeddedState(isEmbedded);
    
    // Check for existing tokens first
    this.checkExistingTokens();
    
    // Check for redirect URLs in both sessionStorage and SharedService
    this.checkAndHandleRedirects();
    
    // Setup router event subscription
    this.setupRouterEventListener();
  }

  ngOnDestroy() {
    // Clean up the postMessage event listener
    if (this.messageEventListener) {
      window.removeEventListener('message', this.messageEventListener);
    }
    
    // Clean up router subscription
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
  
  private checkExistingTokens() {
    const token = localStorage.getItem('serviceToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (token) {
      // Create mock SSO message to update the service
      const ssoMessage: SSOMessage = {
        embedded: this.sharedService.isEmbedded(),
        accessToken: token,
        refreshToken: refreshToken || null
      };
      
      // Update the shared service with existing tokens
      this.sharedService.updateSSOData(ssoMessage);
    }
  }
  
  private checkAndHandleRedirects() {
    // Check if we have a token
    const hasToken = !!localStorage.getItem('serviceToken');
    if (!hasToken) {
      return;
    }
    
    // First check sessionStorage for direct URL
    const sessionRedirect = sessionStorage.getItem('idra_admin_redirect');
    if (sessionRedirect) {
      // Ensure URL is properly formatted for internal navigation
      let redirectUrl = sessionRedirect;
      if (!redirectUrl.startsWith('/') && !redirectUrl.startsWith('http')) {
        redirectUrl = '/' + redirectUrl;
      }
      
      // For URLs that look like paths to our app, ensure they're properly formatted
      if (redirectUrl.startsWith('/pages/')) {
        this.performRedirect(redirectUrl);
        return;
      }
      
      // Otherwise try the original URL
      this.performRedirect(sessionRedirect);
      return;
    }
    
    // Then check SharedService for localStorage-persisted URL
    if (this.sharedService.hasPendingAdminUrl()) {
      const pendingUrl = this.sharedService.getPendingAdminUrl();
      if (pendingUrl) {
        this.performRedirect(pendingUrl);
      }
    }
  }
  
  private performRedirect(url: string) {
    // Clear all storage to avoid redirect loops
    sessionStorage.removeItem('idra_admin_redirect');
    localStorage.removeItem('idra_admin_url');
    
    // Check if we're already at the target URL
    if (window.location.href.includes(url) || 
        (url.startsWith('/') && window.location.pathname.includes(url))) {
      return;
    }
    
    // Check if this is an internal URL (starts with / or contains the current hostname)
    const isInternalUrl = url.startsWith('/') || url.includes(window.location.hostname);
    
    if (isInternalUrl) {
      // For internal URLs, use Angular router which avoids frame-related issues
      // Remove leading slash if present for router navigation
      const routerUrl = url.startsWith('/') ? url : '/' + url;
      
      // Use router navigation for internal paths
      this.router.navigateByUrl(routerUrl);
    } else {
      // For external URLs, open in parent window to avoid X-Frame-Options issues
      try {
        if (window.parent && window.parent !== window) {
          window.parent.location.href = url;
        } else {
          window.location.href = url;
        }
      } catch (e) {
        // If accessing parent window fails due to cross-origin issues, fallback to current window
        window.location.href = url;
      }
    }
  }

  private setupPostMessageListener() {
    this.messageEventListener = (event: MessageEvent) => {
      // Ignore React DevTools messages
      if (event.data?.source === 'react-devtools-content-script') {
        return;
      }
      
      try {
        if (this.isValidSSOMessage(event.data)) {
          const ssoMessage: SSOMessage = event.data;
          
          // Update shared service with SSO data
          this.sharedService.updateSSOData(ssoMessage);
          
          // Process the access token
          if (ssoMessage.accessToken) {
            
            // Decode JWT token for user data
            const decodedToken = this.sharedService.decodeJWTToken(ssoMessage.accessToken);
            if (decodedToken) {
              // Store tokens and user data
              localStorage.setItem('serviceToken', ssoMessage.accessToken);
              
              // Store the refresh token if provided
              if (ssoMessage.refreshToken) {
                localStorage.setItem('refreshToken', ssoMessage.refreshToken);
              }
              
              // Create and store Nebular Auth token object
              const authTokenObject = {
                name: "nb:auth:simple:token",
                ownerStrategyName: this.config.config["authenticationMethod"].toLowerCase() === "keycloak" 
                  ? environment.authProfile 
                  : "email",
                createdAt: Date.now(),
                value: ssoMessage.accessToken
              };
              localStorage.setItem('auth_app_token', JSON.stringify(authTokenObject));
              
              // Check for any pending redirects
              this.checkAndHandleRedirects();
            }
          }
          
          // Update URL with embedded parameter if needed
          if (ssoMessage.embedded) {
            const currentUrl = this.router.url;
            const tree = this.router.parseUrl(currentUrl);
            if (tree.queryParams['embedded'] !== 'true') {
              this.router.navigate([], {
                queryParams: { embedded: 'true' },
                queryParamsHandling: 'merge',
                replaceUrl: true,
              });
            }
          }
        }
      } catch (error) {
        console.error('Error processing postMessage:', error);
      }
    };

    window.addEventListener('message', this.messageEventListener);
  }

  private isValidSSOMessage(data: any): boolean {
    return data && 
         typeof data.embedded === 'boolean' &&
         (data.accessToken === undefined || data.accessToken === null || typeof data.accessToken === 'string') &&
         (data.refreshToken === undefined || data.refreshToken === null || typeof data.refreshToken === 'string') &&
         typeof data.language === 'string';
  }

  private getUrlParameter(name: string): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }
  
  private setupRouterEventListener() {
    // Subscribe to router navigation events
    this.routerSubscription = this.router.events
      .pipe(
        // Filter for NavigationStart events only
        filter((event: RouterEvent): event is NavigationStart => event instanceof NavigationStart)
      )
      .subscribe((event: NavigationStart) => {
        // Handle route changes
        this.handleRouteChange(event.url);
      });
  }
  
  private handleRouteChange(url: string) {
    // Skip if on the login page
    if (url.includes('/auth/login')) {
      return;
    }
    
    // Check if this is an administration page
    const isAdminPage = url.includes('/administration/');
    
    // Check if we have a token - either in shared service or localStorage
    const ssoToken = this.sharedService.getSSOToken();
    const localStorageToken = localStorage.getItem('serviceToken');
    
    // If we have a token in SharedService, we're good to go
    if (ssoToken) {
      return;
    }
    
    // If we have a token in localStorage but not in SharedService, load it
    if (localStorageToken && !ssoToken) {
      const refreshToken = localStorage.getItem('refreshToken');
      const ssoMessage = {
        embedded: this.sharedService.isEmbedded(),
        accessToken: localStorageToken,
        refreshToken: refreshToken || null
      };
      this.sharedService.updateSSOData(ssoMessage);
      return;
    }
    
    // If we're in embedded mode, handle first load for admin pages
    if (this.sharedService.isEmbedded() && isAdminPage) {
      // Check if this is first load
      if (this.sharedService.isFirstLoad()) {
        // No token available and it's first load, save URL for redirection
        this.sharedService.setPendingAdminUrl(url);
        sessionStorage.setItem('idra_admin_redirect', url);

        return;
      }
    }
    
    // For admin pages without token, check Nebular authentication
    if (isAdminPage && !localStorageToken && !ssoToken) {
      this.authService.isAuthenticated().subscribe(authenticated => {
        if (!authenticated) {
          // Store current URL for redirection after login
          this.sharedService.setPendingAdminUrl(url);
          
          // Navigate to login
          this.router.navigate(['/pages/auth/login']);
        }
      });
    }
  }
}
