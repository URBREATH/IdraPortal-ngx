import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ModelsToolsComponent } from './models-tools.component';



const routes: Routes = [
  {
    path:'',
    component:ModelsToolsComponent
    }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ModelsToolsRoutingModule { }
