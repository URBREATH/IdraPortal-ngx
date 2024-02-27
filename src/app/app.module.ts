/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { HttpClientModule, HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ConfigModule, ConfigLoader } from '@ngx-config/core';
import { ConfigHttpLoader } from '@ngx-config/http-loader';
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
import { NbPasswordAuthStrategy } from './@theme/components/auth/public_api';


export function configFactory(http: HttpClient): ConfigLoader {
  return new ConfigHttpLoader(http, './assets/config.json');
}

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [AppComponent, 
    // AuthLogoutComponent
  ],
  imports: [
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
    ConfigModule.forRoot({
      provide: ConfigLoader,
      useFactory: configFactory,
      deps: [HttpClient]
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
          view: ['external-app', 'maps', 'home', 'about', 'charts', 'lorem-ipsum']
        },
        CITIZEN: {
          view: ['home', 'about', 'ui-features','catalogues']
        }
      },
    }),

    NbAuthModule.forRoot({
      strategies: [
        NbPasswordAuthStrategy.setup({
          name: 'email',
          baseEndpoint: 'http://localhost:8080/Idra/api/v1/administration',
          login: {
            alwaysFail: false,
            endpoint: '/login',
            method: 'post',
            redirect: {
              success: '/',
              failure: null,
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
              success: '/',
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
  // providers: [
  //   AuthGuard,
  //   {
  //     provide: HTTP_INTERCEPTORS,
  //     useClass: TokenInterceptor,
  //     multi: true
  //   }
  // ],
  providers: [NbSidebarService],
  bootstrap: [AppComponent],
})
export class AppModule {
}
