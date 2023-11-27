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
import {
  NbDatepickerModule,
  NbDialogModule,
  NbMenuModule,
  NbSidebarModule,
  NbToastrModule,
  NbWindowModule,
} from '@nebular/theme';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { NbRoleProvider, NbSecurityModule } from '@nebular/security';
import { TokenInterceptor } from './auth/services/token.interceptor';
import { AuthGuard } from './auth/services/auth.guard';
import { AuthLogoutComponent } from './auth/logout/auth-logout.component';
import { MarkdownModule } from 'ngx-markdown';

import { RouterModule } from '@angular/router';


export function configFactory(http: HttpClient): ConfigLoader {
  return new ConfigHttpLoader(http, './assets/config.json');
}

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [AppComponent, AuthLogoutComponent],
  imports: [
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

  ],
  providers: [
    AuthGuard,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
}
