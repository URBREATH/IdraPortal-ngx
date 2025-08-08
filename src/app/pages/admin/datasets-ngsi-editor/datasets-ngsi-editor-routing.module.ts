import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DatasetsNgsiEditorComponent } from './datasets-ngsi-editor.component';

const routes: Routes = [
  {
    path: '',
    component: DatasetsNgsiEditorComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DatasetsNgsiEditorRoutingModule { }
