  import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

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
import { DataSourcesEditorComponent } from './data-sources-editor.component';
import { DataSourcesEditorRoutingModule } from './data-sources-editor-routing.module';

@NgModule({
  declarations: [
    DataSourcesEditorComponent
  ],
  imports: [
    CommonModule,
    DataSourcesEditorRoutingModule,
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
export class DataSourcesEditorModule { }
