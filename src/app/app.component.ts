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
import { NbAuthService, NbAuthJWTToken } from '@nebular/auth';
import { EmbeddedLanguageService } from './services/embedded-language.service';

@Component({
  selector: 'ngx-app',
  template: '<router-outlet></router-outlet>',
})
export class AppComponent implements OnInit, OnDestroy {
  private messageEventListener: (event: MessageEvent) => void;

  constructor(
    private oauthStrategy: NbOAuth2AuthStrategy,
    private oauthStrategyPwd: NbPasswordAuthStrategy,
    private http: HttpClient,
    private config: ConfigService<Record<string, any>>,
    private router: Router,
    private sharedService: SharedService,
    private embeddedLanguageService: EmbeddedLanguageService, // Just inject it to start the service
    private authService: NbAuthService // Add this
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
    
    // Test SSO with provided tokens
    // this.testSSOLogin();
    
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
      // Ignore React DevTools messages
      if (event.data?.source === 'react-devtools-content-script') {
        return;
      }

      console.log('AppComponent: Received postMessage event:', event);
      console.log('AppComponent: Message origin:', event.origin);
      console.log('AppComponent: Message data:', event.data);
      
      // Validate the message structure
      if (this.isValidSSOMessage(event.data)) {
        console.log('AppComponent: SSO message validation passed');
        
        const ssoMessage: SSOMessage = event.data;
        
        // Update shared service with SSO data
        this.sharedService.updateSSOData(ssoMessage);
        
        // Process the access token
        if (ssoMessage.accessToken) {
          console.log('AppComponent: Setting up localStorage with SSO token');
          
          // Decode JWT token for user data
          const decodedToken = this.sharedService.decodeJWTToken(ssoMessage.accessToken);
          if (decodedToken) {
            console.log('AppComponent: Decoded JWT token:', decodedToken);
            
            // 1. Store the service token (access token)
            localStorage.setItem('serviceToken', ssoMessage.accessToken);
            
            // 2. Store the refresh token if provided
            if (ssoMessage.refreshToken) {
              localStorage.setItem('refreshToken', ssoMessage.refreshToken);
            }
            
            // 3. Store simple token string (for backward compatibility)
            localStorage.setItem('token', ssoMessage.accessToken);
            
            // 4. Extract username from JWT token
            const username = decodedToken.preferred_username || 
                             decodedToken.name || 
                             decodedToken.email || 
                             decodedToken.sub || 
                             'sso_user';
            localStorage.setItem('username', username);
            
            // 5. Create and store Nebular Auth token object
            const authTokenObject = {
              name: "nb:auth:simple:token",
              ownerStrategyName: this.config.config["authenticationMethod"].toLowerCase() === "keycloak" 
                ? environment.authProfile 
                : "email",
              createdAt: Date.now(),
              value: ssoMessage.accessToken
            };
            localStorage.setItem('auth_app_token', JSON.stringify(authTokenObject));
            
            // 6. Create persist:users structure
            const currentUser = {
              userId: decodedToken.sub,
              username: decodedToken.preferred_username || username,
              firstName: decodedToken.given_name || decodedToken.name || 'Admin',
              lastName: decodedToken.family_name || '',
              email: decodedToken.email || '',
              pilotRole: decodedToken.pilot_role || 'ADMIN',
              pilotCode: decodedToken.pilot_code || 'AARHUS'
            };
            
            const persistUsers = {
              allUsers: "[]",
              currentUser: JSON.stringify(currentUser),
              error: "null",
              loading: "false",
              newUser: "null",
              _persist: JSON.stringify({version: -1, rehydrated: true})
            };
            
            // Store each persist:users entry
            Object.keys(persistUsers).forEach(key => {
              localStorage.setItem(`persist:users:${key}`, persistUsers[key]);
            });
            
            console.log('AppComponent: localStorage set up successfully');
            console.log('AppComponent: Current user:', currentUser);
            
            // Navigate to the main application
            // this.router.navigateByUrl('/pages'); // <-- REMOVE THIS LINE
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
      else {
        console.warn('AppComponent: Invalid SSO message received:', event.data);
      }
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

  // private testSSOLogin(): void {
  //   console.log('AppComponent: Testing SSO login with provided tokens');
    
  //   // Use an ACCESS token (typ: "Bearer") - you'll need to get this from your Keycloak
  //   const accessToken = '800A'; // Replace with actual access token
    
  //   // This can remain a refresh token
  //   const refreshToken = '800B';
    
  //   // Create a mock SSO message
  //   const mockSSOMessage: SSOMessage = {
  //     embedded: false,
  //     accessToken: accessToken, // Use proper access token here
  //     refreshToken: refreshToken,
  //     language: 'en'
  //   };
    
  //   // Simulate sending the SSO message to the listener
  //   console.log('AppComponent: Simulating postMessage with SSO data');
  //   const mockEvent = new MessageEvent('message', {
  //     data: mockSSOMessage,
  //     origin: window.location.origin,
  //     source: window
  //   });
    
  //   // Trigger the message event handler directly
  //   if (this.messageEventListener) {
  //     this.messageEventListener(mockEvent);
  //   }
  // }
}
