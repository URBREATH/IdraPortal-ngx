import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CataloguesRoutingModule } from './catalogues-routing.module';
import { CataloguesComponent } from './catalogues.component';
import { NbCardModule, NbIconModule, NbListModule, NbSelectModule, NbSpinnerModule, NbTooltipModule } from '@nebular/theme';
import { TranslateModule } from '@ngx-translate/core';


@NgModule({
  declarations: [CataloguesComponent],
  imports: [
    CommonModule,
    TranslateModule,
    CataloguesRoutingModule,
    NbCardModule,
    NbSelectModule,
    NbSpinnerModule,
    NbListModule,
    NbIconModule,
    NbTooltipModule
    
  ]
})
export class CataloguesModule { }
