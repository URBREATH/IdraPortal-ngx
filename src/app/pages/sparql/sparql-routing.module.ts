import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SparqlComponent } from './sparql.component';


const routes: Routes = [
  {
    path:'',
    component:SparqlComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SparqlRoutingModule { }
