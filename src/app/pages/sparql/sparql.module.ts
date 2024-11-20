import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SparqlRoutingModule } from './sparql-routing.module';
import { SparqlComponent } from './sparql.component';
import { NbButtonModule, NbCardModule, NbCheckboxModule, NbDatepickerModule, NbIconModule, NbInputModule, NbListModule, NbSelectModule, NbTabsetModule, NbTagModule, NbTooltipModule } from '@nebular/theme';
import { MatCardModule } from '@angular/material/card';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { NgdCodeBlockComponent } from './code-block/code-block.component';
import { CodeEditorModule } from '@ngstack/code-editor';


@NgModule({
  declarations: [SparqlComponent, NgdCodeBlockComponent],
  imports: [
    CommonModule,
    SparqlRoutingModule,
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
    CodeEditorModule
  ]
})
export class SparqlModule { }
