/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { HttpClientModule, HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ConfigModule } from 'ngx-config-json';
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
import { NbAuthModule } from './@theme/components/auth/auth.module';
import { NbAuthSimpleInterceptor, NbPasswordAuthStrategy } from './@theme/components/auth/public_api';
import { NgxEchartsModule } from 'ngx-echarts';
import { CodeEditorModule } from '@ngstack/code-editor';


class GenericConfig<T> {
  constructor(public config: T) {}
}

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [AppComponent, 
    // AuthLogoutComponent
  ],
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
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
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

    // changes must be done in app.component.ts
    NbAuthModule.forRoot({
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
              failure: null,
            },
          },
        }),
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
  ],
  providers: [NbSidebarService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: NbAuthSimpleInterceptor,
      multi: true,
    }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
}
