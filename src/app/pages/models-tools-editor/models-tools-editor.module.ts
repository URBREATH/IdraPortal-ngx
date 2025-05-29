  import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ModelsToolsEditorRoutingModule } from './models-tools-editor-routing.module';
import { ModelsToolsEditorComponent } from './models-tools-editor.component';

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
  NbTooltipModule,  
} from '@nebular/theme';

@NgModule({
  declarations: [
    ModelsToolsEditorComponent
  ],
  imports: [
    CommonModule,
    ModelsToolsEditorRoutingModule,
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
    NbTooltipModule,
    TranslateModule,
  ]
})
export class ModelsToolsEditorModule { }