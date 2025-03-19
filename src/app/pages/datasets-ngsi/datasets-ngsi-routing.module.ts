import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DatasetsNgsiComponent } from './datasets-ngsi.component';


const routes: Routes = [
  {
    path:'',
    component:DatasetsNgsiComponent
    }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DatasetsNgsiRoutingModule { }
