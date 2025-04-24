import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DatasetsNgsiEditorRoutingModule } from './datasets-ngsi-editor-routing.module';
import { DatasetsNgsiEditorComponent } from '../datasets-ngsi-editor/datasets-ngsi-editor.component';

// Reactive Forms module
import { ReactiveFormsModule } from '@angular/forms';

// Nebular modules
import { 
  NbIconModule, 
  NbButtonModule, 
  NbCardModule, 
  NbInputModule, 
  NbStepperModule, 
  NbSelectModule, 
  NbDatepickerModule, 
  NbCheckboxModule,
  NbTagModule,
  NbTooltipModule
} from '@nebular/theme';

@NgModule({
  declarations: [
    DatasetsNgsiEditorComponent
  ],
  imports: [
    CommonModule,
    DatasetsNgsiEditorRoutingModule,
    ReactiveFormsModule,
    NbIconModule,
    NbButtonModule,
    NbCardModule,
    NbInputModule,
    NbStepperModule,
    NbSelectModule,
    NbDatepickerModule,
    NbCheckboxModule,
    NbTagModule,
    NbTooltipModule
  ]
})
export class DatasetsNgsiEditorModule { }
