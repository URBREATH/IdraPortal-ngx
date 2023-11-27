import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfoComponent } from './info/info.component';
import { SiteComponent } from './site/site.component';
import { AboutComponent } from './about.component';
import { AboutRoutingModule } from './about-routing.module';
import { NbCardModule } from '@nebular/theme';
import { MatCardModule } from '@angular/material/card';



@NgModule({
  declarations: [InfoComponent, SiteComponent, AboutComponent],
  imports: [
    CommonModule,
    AboutRoutingModule,
    NbCardModule,
    MatCardModule
  ]
})
export class AboutModule { }
