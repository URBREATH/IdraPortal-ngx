import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing.module';
import { HomeComponent } from './home.component';
import { NbButtonModule, NbCardModule, NbCheckboxModule, NbDatepickerModule, NbIconModule, NbInputModule, NbListModule, NbSelectModule, NbTabsetModule, NbTagModule, NbTooltipModule } from '@nebular/theme';
import { MatCardModule } from '@angular/material/card';
import { CarouselModule } from 'ngx-owl-carousel-o';


@NgModule({
  declarations: [HomeComponent],
  imports: [
    CommonModule,
    HomeRoutingModule,
    NbCardModule,
    MatCardModule,
    CarouselModule,
    NbTabsetModule,
    NbListModule,
    NbIconModule,
    NbTagModule,
    NbIconModule,
    NbButtonModule,
    NbTooltipModule,
    NbSelectModule,
    NbInputModule,
    NbDatepickerModule,
    NbCheckboxModule,
  ]
})
export class HomeModule { }
