import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ModelsToolsEditorComponent } from './models-tools-editor.component';

const routes: Routes = [
  {
    path: '',
    component: ModelsToolsEditorComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ModelsToolsEditorRoutingModule { }
