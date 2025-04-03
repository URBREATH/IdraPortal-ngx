import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatasetsNgsiRoutingModule } from './datasets-ngsi-routing.module';
import { DatasetsNgsiComponent } from './datasets-ngsi.component';
import { NbAccordionModule, NbButtonModule, NbCardModule, NbCheckboxModule, NbIconModule, NbInputModule, NbListModule,} from '@nebular/theme';
import { TranslateModule } from '@ngx-translate/core';


@NgModule({
    declarations: [ DatasetsNgsiComponent ],
    imports: [
        CommonModule,
        TranslateModule,
        DatasetsNgsiRoutingModule,
        NbCardModule,
        NbInputModule,  
        NbButtonModule,
        NbAccordionModule,
        NbListModule,
        NbIconModule,
        NbCheckboxModule
    ],
    })
export class DatasetsNgsiModule { }