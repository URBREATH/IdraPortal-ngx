import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StatisticsRoutingModule } from './statistics-routing.module';
import { StatisticsComponent } from './statistics.component';
import {  NbCardModule, NbSelectModule } from '@nebular/theme';
import { NgxEchartsModule } from 'ngx-echarts';
import { TranslateModule } from '@ngx-translate/core';


@NgModule({
  declarations: [StatisticsComponent],
  imports: [
    CommonModule,
    StatisticsRoutingModule,
    NbCardModule,
    NgxEchartsModule,
    TranslateModule,
    NbSelectModule
  ]
})
export class StatisticsModule { }
