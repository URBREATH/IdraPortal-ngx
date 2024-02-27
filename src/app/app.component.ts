/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { Component, OnInit } from '@angular/core';
import { AnalyticsService } from './@core/utils/analytics.service';
import { SeoService } from './@core/utils/seo.service';

import { v4 as uuidv4 } from 'uuid';
import { NbAuthJWTToken, NbAuthOAuth2JWTToken, NbAuthOAuth2Token, NbAuthService, NbAuthStrategy, NbOAuth2AuthStrategy, NbOAuth2ClientAuthMethod, NbOAuth2ResponseType } from '@nebular/auth';
import { ConfigService } from '@ngx-config/core';
// import { OidcJWTToken } from './auth/oidc/oidc';

@Component({
  selector: 'ngx-app',
  template: '<router-outlet></router-outlet>',
})
export class AppComponent implements OnInit {


  constructor(
    // private analytics: AnalyticsService,
    //  private seoService: SeoService,
    //  private configService: ConfigService,
    // authService: NbAuthService, // force construction of the auth service
    // oauthStrategy: NbOAuth2AuthStrategy
    ) {

    // oauthStrategy.setOptions({
    //   name: configService.getSettings("authProfile"),
    //   clientId: configService.getSettings("client_id"),
    //   clientSecret: configService.getSettings("client_secret"),
    //   baseEndpoint: `${configService.getSettings("idmBaseURL")}/auth/realms/${configService.getSettings("idmRealmName")}/protocol/openid-connect`,
    //   clientAuthMethod: NbOAuth2ClientAuthMethod.NONE,
    //   token: {
    //     endpoint: '/token',
    //     redirectUri: `${configService.getSettings("dashboardBaseURL")}/auth/callback`,
    //     class: OidcJWTToken,
    //     key: 'access_token'
    //   },
    //   authorize: {
    //     endpoint: '/auth',
    //     scope: 'openid',
    //     state: uuidv4(),
    //     redirectUri: `${configService.getSettings("dashboardBaseURL")}/auth/callback`,
    //     responseType: NbOAuth2ResponseType.CODE
    //   },
    //   redirect: {
    //     success: '/pages', // welcome page path
    //     failure: null, // stay on the same page
    //   },
    //   refresh: {
    //     // endpoint: 'token',
    //     // grantType: NbOAuth2GrantType.REFRESH_TOKEN,
    //   }
    // })
  }

  ngOnInit(): void {
    // this.analytics.trackPageViews();
    // this.seoService.trackCanonicalChanges();
  }
}
