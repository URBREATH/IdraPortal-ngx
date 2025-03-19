import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatasetsNgsiRoutingModule } from './datasets-ngsi-routing.module';
import { DatasetsNgsiComponent } from './datasets-ngsi.component';
import { NbCardModule, NbIconModule, NbListModule, NbSelectModule, NbSpinnerModule, NbTooltipModule } from '@nebular/theme';
import { TranslateModule } from '@ngx-translate/core';


@NgModule({
    declarations: [ DatasetsNgsiComponent ],
    imports: [
        CommonModule,
        TranslateModule,
        DatasetsNgsiRoutingModule,
        NbCardModule,
        NbSelectModule,
        NbSpinnerModule,
        NbListModule,
        NbIconModule,
        NbTooltipModule
    ],
    })
export class DatasetsNgsiModule { }