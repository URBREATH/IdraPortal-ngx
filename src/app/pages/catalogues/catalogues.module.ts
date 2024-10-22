import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CataloguesRoutingModule } from './catalogues-routing.module';
import { CataloguesComponent } from './catalogues.component';
import { NbCardModule, NbIconModule, NbListModule, NbSelectModule, NbSpinnerModule, NbTooltipModule } from '@nebular/theme';


@NgModule({
  declarations: [CataloguesComponent],
  imports: [
    CommonModule,
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
