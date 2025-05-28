import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NbCardModule, NbListModule, NbButtonModule, NbCheckboxModule, NbIconModule, NbDialogModule, NbToastrModule, NbAccordionModule, NbInputModule, NbTagModule } from '@nebular/theme';
import { SharedModule } from '../../shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';
import { NgxPaginationModule } from 'ngx-pagination';
import { ModelsToolsComponent } from './models-tools.component';
import { ModelsToolsRoutingModule } from './models-tools-routing.module';

@NgModule({
  declarations: [
    ModelsToolsComponent
  ],
  imports: [
    CommonModule,
    NbAccordionModule,
    TranslateModule,
    ModelsToolsRoutingModule,
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
    ModelsToolsComponent
  ]
})
export class ModelsToolsModule { }