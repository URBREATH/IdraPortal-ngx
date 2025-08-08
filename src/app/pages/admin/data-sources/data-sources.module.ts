import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NbCardModule, NbListModule, NbButtonModule, NbCheckboxModule, NbIconModule, NbDialogModule, NbToastrModule, NbAccordionModule, NbInputModule, NbTagModule } from '@nebular/theme';
import { SharedModule } from '../../../shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';
import { NgxPaginationModule } from 'ngx-pagination';
import { DataSourcesComponent } from './data-sources.component';
import { DataSourcesRoutingModule } from './data-sources-routing.module';

@NgModule({
  declarations: [
    DataSourcesComponent
  ],
  imports: [
    CommonModule,
    NbAccordionModule,
    TranslateModule,
    DataSourcesRoutingModule,
    NbCardModule,
    NbListModule,
    NbInputModule,  
    NbButtonModule,
    NbCheckboxModule,
    NbIconModule,
    NbDialogModule.forChild(),
    NbToastrModule,
    SharedModule,
    NgxPaginationModule,
    NbTagModule
  ],
  exports: [
    DataSourcesComponent
  ]
})
export class DataSourcesModule { }