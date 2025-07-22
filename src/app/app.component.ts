/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ConfigService } from 'ngx-config-json';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { NbAuthOAuth2JWTToken, NbOAuth2AuthStrategy, NbOAuth2ClientAuthMethod, NbOAuth2GrantType, NbOAuth2ResponseType } from '@nebular/auth';
import { OidcJWTToken } from './pages/auth/oidc/oidc';
import { NbPasswordAuthStrategy } from './@theme/components/auth/public_api';
import { Router, NavigationEnd } from '@angular/router';
import { filter, take } from 'rxjs/operators';
import { SSOMessage } from './models';
import { SharedService } from './pages/services/shared.service';

@Component({
  selector: 'ngx-app',
  template: '<router-outlet></router-outlet>',
})
export class AppComponent implements OnInit, OnDestroy {
  private messageEventListener: (event: MessageEvent) => void;

  constructor(
     oauthStrategy: NbOAuth2AuthStrategy,
     oauthStrategyPwd:NbPasswordAuthStrategy,
    private http : HttpClient,
    private config:ConfigService<Record<string, any>>,
    private router: Router,
    private sharedService: SharedService,
    ) {
     if(this.config.config["authenticationMethod"].toLowerCase() === "keycloak"){
     
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
          success: '/pages', // welcome page path
          failure: null, // stay on the same page
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
        // ...
        alwaysFail: false,
        endpoint: '/logout',
        method: 'post',
        redirect: {
          success: '/pages/auth/login',
          failure: '/pages/home',
        },
      },
      });
    }  
  }

  ngOnInit() {
    console.log('AppComponent: Initializing...');
    
    // Setup postMessage listener for SSO
    this.setupPostMessageListener();
    
    // Check for embedded parameter in URL
    const embeddedParam = this.getUrlParameter('embedded');
    console.log('AppComponent: Embedded URL parameter:', embeddedParam);
    
    const isEmbedded = embeddedParam === 'true';
    console.log('AppComponent: Initial embedded state:', isEmbedded);
    
    // Update shared service with embedded state from URL
    this.sharedService.updateEmbeddedState(isEmbedded);
    
    console.log('AppComponent: Initialization complete');
  }

  ngOnDestroy() {
    // Clean up the postMessage event listener
    if (this.messageEventListener) {
      window.removeEventListener('message', this.messageEventListener);
    }
  }

  private setupPostMessageListener() {
    console.log('AppComponent: Setting up postMessage listener');
    
    this.messageEventListener = (event: MessageEvent) => {
      console.log('AppComponent: Received postMessage event:', event);
      console.log('AppComponent: Message origin:', event.origin);
      console.log('AppComponent: Message data:', event.data);
      
      // Validate the message structure
      if (this.isValidSSOMessage(event.data)) {
        console.log('AppComponent: SSO message validation passed');
        
        const ssoMessage: SSOMessage = event.data;
        
        // Update shared service with SSO data
        this.sharedService.updateSSOData(ssoMessage);
        
        // Decode JWT token for user role and other data
        if (ssoMessage.accessToken) {
          console.log('AppComponent: Decoding JWT token...');
          const decodedToken = this.sharedService.decodeJWTToken(ssoMessage.accessToken);
          if (decodedToken) {
            console.log('AppComponent: Decoded JWT token:', decodedToken);
            // You can use the decoded token data here for user role, etc.
          } else {
            console.warn('AppComponent: Failed to decode JWT token');
          }
        }
        
        // Update URL with embedded parameter if needed
        if (ssoMessage.embedded) {
          console.log('AppComponent: Updating URL for embedded mode');
          const currentUrl = this.router.url;
          const tree = this.router.parseUrl(currentUrl);
          if (tree.queryParams['embedded'] !== 'true') {
            this.router.navigate([], {
              queryParams: { embedded: 'true' },
              queryParamsHandling: 'merge',
              replaceUrl: true,
            });
            console.log('AppComponent: URL updated with embedded=true');
          }
        }
      } 
      // else {
      //   console.warn('AppComponent: Invalid SSO message received:', event.data);
      // }
    };

    window.addEventListener('message', this.messageEventListener);
    console.log('AppComponent: PostMessage listener registered');
  }

  private isValidSSOMessage(data: any): boolean {
    const isValid = data && 
         typeof data.embedded === 'boolean' &&
         (data.accessToken === undefined || data.accessToken === null || typeof data.accessToken === 'string') &&
         (data.refreshToken === undefined || data.refreshToken === null || typeof data.refreshToken === 'string') &&
         typeof data.language === 'string';
    
    console.log('AppComponent: SSO message validation result:', isValid);
    if (!isValid) {
      console.log('AppComponent: Validation failed for data:', data);
    }
    
    return isValid;
  }

  private getUrlParameter(name: string): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }
}
