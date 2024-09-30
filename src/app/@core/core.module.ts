import { ModuleWithProviders, NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_RIPPLE_GLOBAL_OPTIONS } from '@angular/material/core';

import { throwIfAlreadyLoaded } from './module-import-guard';
import {
  AnalyticsService,
  LayoutService,
  SeoService,
  StateService,
} from './utils';
import { UserActivityData } from './data/user-activity';
import { VisitorsAnalyticsData } from './data/visitors-analytics';

import { UserActivityService } from './mock/user-activity.service';
import { VisitorsAnalyticsService } from './mock/visitors-analytics.service';
import { MockDataModule } from './mock/mock-data.module';
import { RippleService } from './utils/ripple.service';
import { NbRoleProvider } from '@nebular/security';
// import { OidcUserInformationService } from '../auth/services/oidc-user-information.service';
// import { OidcJWTToken } from '../auth/oidc/oidc';
import { NbAuthModule, NbAuthOAuth2JWTToken, NbOAuth2AuthStrategy } from '@nebular/auth';

const socialLinks = [
];

const DATA_SERVICES = [
  { provide: UserActivityData, useClass: UserActivityService },
  { provide: VisitorsAnalyticsData, useClass: VisitorsAnalyticsService },
  { provide: MAT_RIPPLE_GLOBAL_OPTIONS, useExisting: RippleService },
];

export const NB_CORE_PROVIDERS = [
  ...MockDataModule.forRoot().providers,
  ...DATA_SERVICES,
  AnalyticsService,
  LayoutService,
  SeoService,
  StateService,
  // ...NbAuthModule.forRoot({
  //   strategies: [
  //     NbOAuth2AuthStrategy.setup({
  //       name: 'oidc',
  //       clientId: '',
  //       token: {
  //         class: OidcJWTToken
  //       }
  //     }),
  //   ],
  // }).providers,
  // { provide: NbRoleProvider, useClass: OidcUserInformationService },
];

@NgModule({
  imports: [
    CommonModule,
  ],
  exports: [
  ],
  declarations: [],
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    throwIfAlreadyLoaded(parentModule, 'CoreModule');
  }

  static forRoot(): ModuleWithProviders<CoreModule> {
    return {
      ngModule: CoreModule,
      providers: [
        ...NB_CORE_PROVIDERS
      ],
    };
  }
}
