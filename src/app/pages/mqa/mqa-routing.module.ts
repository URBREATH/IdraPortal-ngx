import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MqaComponent } from './mqa.component';

const routes: Routes = [
  {
    path:'',
    component:MqaComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MqaRoutingModule { }
