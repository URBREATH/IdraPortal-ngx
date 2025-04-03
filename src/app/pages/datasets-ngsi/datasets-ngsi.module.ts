import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatasetsNgsiRoutingModule } from './datasets-ngsi-routing.module';
import { DatasetsNgsiComponent } from './datasets-ngsi.component';
import { NbCardModule, NbListModule, NbButtonModule, NbCheckboxModule, NbIconModule, NbDialogModule, NbToastrModule, NbAccordionModule, NbInputModule } from '@nebular/theme';
import { SharedModule } from '../../shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    DatasetsNgsiComponent
  ],
  imports: [
    CommonModule,
    NbAccordionModule,
    TranslateModule,
    DatasetsNgsiRoutingModule,
    NbCardModule,
    NbListModule,
    NbInputModule,  
    NbButtonModule,
    NbCheckboxModule,
    NbIconModule,
    NbDialogModule.forChild(),
    NbToastrModule,
    SharedModule
  ],
  exports: [
    DatasetsNgsiComponent
  ]
})
export class DatasetsNgsiModule { }