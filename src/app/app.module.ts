/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { InjectionToken, NgModule } from '@angular/core';
import { HttpClientModule, HttpClient, HTTP_INTERCEPTORS, HttpHeaders } from '@angular/common/http';
import { ConfigModule, ConfigService } from 'ngx-config-json';
import { TranslateHttpLoader } from "@ngx-translate/http-loader";
import { CoreModule } from './@core/core.module';
import { ThemeModule } from './@theme/theme.module';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
// import { NgxAuthRoutingModule } from './auth-routing.module_old';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  NbDatepickerModule,
  NbDialogModule,
  NbMenuModule,
  NbSidebarModule,
  NbToastrModule,
  NbWindowModule,
  NbAlertModule,
  NbButtonModule,
  NbCheckboxModule,
  NbInputModule,
  NbSidebarService
} from '@nebular/theme';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { NbRoleProvider, NbSecurityModule } from '@nebular/security';
// import { NbPasswordAuthStrategy, NbAuthModule } from '@nebular/auth';
import { MarkdownModule } from 'ngx-markdown';
import { RouterModule } from '@angular/router';
import { NgxEchartsModule } from 'ngx-echarts';
import { CodeEditorModule } from '@ngstack/code-editor';
import { NbAuthModule,  NbOAuth2AuthStrategy, NbOAuth2ClientAuthMethod, NbOAuth2GrantType, NbOAuth2ResponseType } from '@nebular/auth';
import { environment } from '../environments/environment';
import { OidcJWTToken } from './pages/auth/oidc/oidc';
import { TokenInterceptor } from './pages/auth/services/token.interceptor';
import { JwtHelperService, JwtModule } from '@auth0/angular-jwt';
import { NbAuthModuleCustom, NbAuthSimpleInterceptor, NbPasswordAuthStrategy } from './@theme/components/auth/public_api';
import { Observable } from 'rxjs';
import { SharedModule } from './shared/shared.module';
class GenericConfig<T> {
  constructor(public config: T) {}
}

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}
const URL = 'https://raw.githubusercontent.com/BeOpen-project/IdraPortal-ngx-Translations';

export class CustomTranslateLoader implements TranslateLoader {
  contentHeader = new HttpHeaders({
  });
  constructor(private httpClient: HttpClient) { }

  getTranslation(lang: string): Observable<any> {
    const url = `${URL}/main/v1.0/${lang}.json`;
    const extUrl = `${URL}/main/v1.1/ext/${lang}.json`;

    // let idra = this.httpClient.get(url,{ withCredentials: true });
    let idra = this.httpClient.get(url);
    
   return idra;
  }
}

@NgModule({
  declarations: [AppComponent],
  imports: [
  
    NgxEchartsModule.forRoot({
      echarts: () => import('echarts')
    }),
    CommonModule,
    FormsModule,
    RouterModule,
    NbAlertModule,
    NbInputModule,
    NbButtonModule,
    NbCheckboxModule,
    // NgxAuthRoutingModule,

    NbAuthModule,
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    NbSidebarModule.forRoot(),
    NbMenuModule.forRoot(),
    NbDatepickerModule.forRoot(),
    NbDialogModule.forRoot(),
    NbWindowModule.forRoot(),
    NbToastrModule.forRoot(),
    CoreModule.forRoot(),
    ThemeModule.forRoot(),
    MarkdownModule.forRoot(),
    CodeEditorModule.forRoot(),
    ConfigModule.forRoot({
      pathToConfig: 'assets/config.json',
      configType: GenericConfig
    }),
    TranslateModule.forRoot({
      defaultLanguage: 'en',
      loader: {
        provide: TranslateLoader,
        useClass: CustomTranslateLoader,
        deps: [HttpClient],
      },
    }),

    NbSecurityModule.forRoot({
      accessControl: {
        ADMIN: {
          view: '*'
        },
        MANAGER: {
          view: ['home', 'sparql', 'catalogues', 'mqa', 'statistics', 'datasets', 'administration']	
        },
        CITIZEN: {
          view: ['home', 'sparql', 'catalogues', 'datasets', 'mqa', 'statistics']
        }
      },
    }),
    JwtModule.forRoot({
      config: {
        tokenGetter: () => {
          return localStorage.getItem('token');

        }
      }
    }),
    // changes must be done in app.component.ts
    NbAuthModule.forRoot({
      strategies: [
        NbOAuth2AuthStrategy.setup({
          name: environment.authProfile, 
          clientId: environment.client_id,
          clientSecret: environment.client_secret,
          baseEndpoint: `${environment.idmBaseURL}/auth/realms/${environment.idmRealmName}/protocol/openid-connect`,
          clientAuthMethod: NbOAuth2ClientAuthMethod.NONE,
          token: {
            endpoint: '/token',
            redirectUri: `/keycloak-auth/callback`,
            class: OidcJWTToken,
          },
          authorize: {
            endpoint: '/auth',
            scope: 'openid',
            redirectUri: `/keycloak-auth/callback`,
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
          
        }),
        
      ],forms: {}}),
      NbAuthModuleCustom.forRoot({
        strategies: [
        NbPasswordAuthStrategy.setup({
        name: 'email',
        baseEndpoint: '',
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
            failure: '/pages/auth/login',
          } 
          
        }}),
        
      ],
      forms: {
        login: {
          redirectDelay: 500, // delay before redirect after a successful login, while success message is shown to the user
          strategy: 'email',  // strategy id key.
          rememberMe: true,   // whether to show or not the `rememberMe` checkbox
          showMessages: {     // show/not show success/error messages
            success: true,
            error: true,
          },
          redirect: {
            success: '/pages/administration/adminCatalogues',  // redirect after a successful login
            failure: '/pages/auth/login', // redirect after a failed login
          }
        },
        requestPassword: {
          redirectDelay: 500,
          strategy: 'email',
          showMessages: {
            success: true,
            error: true,
          },
        },
        logout: {
          redirectDelay: 500,
          strategy: 'email',
          redirect: {
            success: '/pages/auth/login',
            failure: '/pages/home',
          },
        },
        validation: {
          password: {
            required: true,
            minLength: 4,
            maxLength: 50,
          },
          email: {
            required: true,
          },
          fullName: {
            required: false,
            minLength: 4,
            maxLength: 50,
          },
        },
      },
    }),
    SharedModule,
  ],
  providers: [NbSidebarService,

  
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: NbAuthSimpleInterceptor,
      multi: true,
    },
    JwtHelperService,
   
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
}
