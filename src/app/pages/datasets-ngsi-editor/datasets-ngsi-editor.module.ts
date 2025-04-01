import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DatasetsNgsiEditorRoutingModule } from './datasets-ngsi-editor-routing.module';
import { DatasetsNgsiEditorComponent } from '../datasets-ngsi-editor/datasets-ngsi-editor.component';


@NgModule({
  declarations: [
    DatasetsNgsiEditorComponent
  ],
  imports: [
    CommonModule,
    DatasetsNgsiEditorRoutingModule,
  ]
})
export class DatasetsNgsiEditorModule { }
