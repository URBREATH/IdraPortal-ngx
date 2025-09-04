/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ConfigService } from 'ngx-config-json';
import { environment } from '../environments/environment';
import { NbOAuth2AuthStrategy, NbOAuth2ClientAuthMethod, NbOAuth2GrantType, NbOAuth2ResponseType } from '@nebular/auth';
import { OidcJWTToken } from './pages/auth/oidc/oidc';
import { NbPasswordAuthStrategy } from './@theme/components/auth/public_api';
import { Router } from '@angular/router';
import { SSOMessage } from './models';
import { SharedService } from './pages/services/shared.service';

@Component({
  selector: 'ngx-app',
  template: '<router-outlet></router-outlet>',
})
export class AppComponent implements OnInit, OnDestroy {
  private messageEventListener: (event: MessageEvent) => void;

  constructor(
    private oauthStrategy: NbOAuth2AuthStrategy,
    private oauthStrategyPwd: NbPasswordAuthStrategy,
    private config: ConfigService<Record<string, any>>,
    private router: Router,
    private sharedService: SharedService,
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
          failure: '/pages/home',
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
    
    // Test SSO with provided tokens
    // this.testSSOLogin();
  }

  ngOnDestroy() {
    // Clean up the postMessage event listener
    if (this.messageEventListener) {
      window.removeEventListener('message', this.messageEventListener);
    }
  }

  private setupPostMessageListener() {
    console.log('🔄 Setting up postMessage listener');
    
    this.messageEventListener = (event: MessageEvent) => {
      // Ignore React DevTools messages
      if (event.data?.source === 'react-devtools-content-script') {
        return;
      }
      
      try {
        console.log('📨 Received message event:', typeof event.data);
        
        if (this.isValidSSOMessage(event.data)) {
          const ssoMessage: SSOMessage = event.data;
          console.log('✅ Valid SSO message received');
          console.log('🔐 Token present:', !!ssoMessage.accessToken);
          console.log('🔄 Refresh token present:', !!ssoMessage.refreshToken);
          
          // Update shared service with SSO data
          this.sharedService.updateSSOData(ssoMessage);
          
          // Process the access token
          if (ssoMessage.accessToken) {
            
            // Decode JWT token for user data
            const decodedToken = this.sharedService.decodeJWTToken(ssoMessage.accessToken);
            if (decodedToken) {
              // Store tokens and user data
              localStorage.setItem('serviceToken', ssoMessage.accessToken);
              
              // 2. Store the refresh token if provided
              if (ssoMessage.refreshToken) {
                localStorage.setItem('refreshToken', ssoMessage.refreshToken);
              }
              
              // 3. Create and store Nebular Auth token object
              const authTokenObject = {
                name: "nb:auth:simple:token",
                ownerStrategyName: this.config.config["authenticationMethod"].toLowerCase() === "keycloak" 
                  ? environment.authProfile 
                  : "email",
                createdAt: Date.now(),
                value: ssoMessage.accessToken
              };
              localStorage.setItem('auth_app_token', JSON.stringify(authTokenObject));
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
        console.error('❌ Error processing postMessage:', error);
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
