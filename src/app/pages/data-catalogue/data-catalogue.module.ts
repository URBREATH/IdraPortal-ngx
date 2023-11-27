import { NgModule } from '@angular/core';

import { ThemeModule } from '../../@theme/theme.module';

import { DataCatalogueRoutingModule } from './data-catalogue-routing.module';
import { SearchComponent } from './search/search.component';
import { DatasetComponent } from './dataset/dataset.component';
import { DataCatalogueComponent } from './data-catalogue.component';
import { NbAccordionModule, NbActionsModule, NbCardModule, NbDialogModule, NbFormFieldModule, NbIconModule, NbInputModule, NbListModule, NbSelectModule, NbSpinnerModule, NbTagModule, NbToastrModule, NbTooltipModule } from '@nebular/theme';
import { NgxPaginationModule } from 'ngx-pagination';
import { DistributionComponent } from './distribution/distribution.component';
import { MarkdownModule } from 'ngx-markdown';
import { DataletIframeComponent } from './datalet-iframe/datalet-iframe.component';
import { ShowDataletsComponent } from './show-datalets/show-datalets.component';
@NgModule({
  declarations: [DataCatalogueComponent, SearchComponent, DatasetComponent, DistributionComponent, DataletIframeComponent, ShowDataletsComponent],
  imports: [
    ThemeModule,
    NbFormFieldModule,
    NbTagModule,
    NbIconModule,
    NbInputModule,
    NbSpinnerModule,
    NbListModule,
    NbCardModule,
    NbTooltipModule,
    NgxPaginationModule,
    NbToastrModule,
    NbAccordionModule,
    NbDialogModule.forChild(),
    DataCatalogueRoutingModule,
    MarkdownModule.forChild(),
    NbActionsModule,
    NbSelectModule
  ]
})
export class DataCatalogueModule { }
