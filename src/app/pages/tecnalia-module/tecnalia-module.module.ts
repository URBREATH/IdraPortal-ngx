import { NgModule }                    from '@angular/core';
import { CommonModule }                from '@angular/common';
import { LeafletModule }               from '@asymmetrik/ngx-leaflet';
import { TecnaliaModuleRoutingModule } from './tecnalia-module-routing.module';
import { TrafficPredictionComponent }  from './traffic-prediction/traffic-prediction.component';
import { BikeAnalysisComponent }       from './bike-analysis/bike-analysis.component';
import {MatSliderModule}               from '@angular/material/slider';

@NgModule({
  declarations: [TrafficPredictionComponent, BikeAnalysisComponent],
  imports: [
    CommonModule,
    LeafletModule,
    MatSliderModule,
    TecnaliaModuleRoutingModule
  ]
})
export class TecnaliaModuleModule { }
