import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DataSourcesEditorComponent } from './data-sources-editor.component';

const routes: Routes = [
  {
    path: '',
    component: DataSourcesEditorComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DataSourcesEditorRoutingModule { }
