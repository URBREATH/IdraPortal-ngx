/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { Component, OnInit } from '@angular/core';
import { ConfigService } from 'ngx-config-json';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { NbAuthOAuth2JWTToken, NbOAuth2AuthStrategy, NbOAuth2ClientAuthMethod, NbOAuth2GrantType, NbOAuth2ResponseType } from '@nebular/auth';
import { OidcJWTToken } from './pages/auth/oidc/oidc';
import { NbPasswordAuthStrategy } from './@theme/components/auth/public_api';
@Component({
  selector: 'ngx-app',
  template: '<router-outlet></router-outlet>',
})
export class AppComponent {

  constructor(
     oauthStrategy: NbOAuth2AuthStrategy,
     oauthStrategyPwd:NbPasswordAuthStrategy,
    private http : HttpClient,
    private config:ConfigService<Record<string, any>>,
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
}
