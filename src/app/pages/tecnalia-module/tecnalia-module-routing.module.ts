import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BikeAnalysisComponent } from './bike-analysis/bike-analysis.component';
import { TrafficPredictionComponent } from './traffic-prediction/traffic-prediction.component';

const routes: Routes = [
  {
    path: 'traffic',
    component: TrafficPredictionComponent,
  }, {
    path: 'bike',
    component: BikeAnalysisComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TecnaliaModuleRoutingModule { }
