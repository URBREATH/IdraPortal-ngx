import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserActivityService } from './user-activity.service';
import { PeriodsService } from './periods.service';
import { VisitorsAnalyticsService } from './visitors-analytics.service';

const SERVICES = [
  UserActivityService,
  PeriodsService,
  VisitorsAnalyticsService,
];

@NgModule({
  imports: [
    CommonModule,
  ],
  providers: [
    ...SERVICES,
  ],
})
export class MockDataModule {
  static forRoot(): ModuleWithProviders<MockDataModule> {
    return {
      ngModule: MockDataModule,
      providers: [
        ...SERVICES,
      ],
    };
  }
}
