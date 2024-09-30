import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing.module';
import { HomeComponent } from './home.component';
import { NbButtonModule, NbCardModule, NbIconModule, NbListModule, NbTabsetModule } from '@nebular/theme';
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
    NbButtonModule
  ]
})
export class HomeModule { }
