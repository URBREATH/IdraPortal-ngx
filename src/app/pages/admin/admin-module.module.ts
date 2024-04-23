import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { CataloguesListComponent } from './catalogues-list/catalogues-list.component';
import { NbAccordionModule, NbActionsModule, NbCardModule, NbDialogModule, NbFormFieldModule, NbIconModule, NbInputModule, NbListModule, NbSelectModule, NbSpinnerModule, NbTagModule, NbToastrModule, NbTooltipModule, NbTreeGridModule, NbToggleModule, NbButtonModule, NbUserModule, NbTableModule, NbCheckboxModule } from '@nebular/theme';
//import { AdminComponent } from './admin.component';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { AddCatalogueComponent } from './add-catalogue/add-catalogue.component';
import { RemoteCataloguesComponent } from './remote-catalogues/remote-catalogues.component';
import { DataletsManagementComponent } from './datalets-management/datalets-management.component';

import { FormsModule } from '@angular/forms';
import { ShowcaseDialogComponent } from './catalogues-list/dialog/showcase-dialog/showcase-dialog.component';
import { NgxEchartsModule } from 'ngx-echarts';
import { ThemeModule } from '../../@theme/theme.module';
import { Ng2SmartTableModule } from 'ng2-smart-table';
import { AdminConfigurationsComponent } from './admin-configurations/admin-configurations.component';
import { PrefixDialogComponent } from './admin-configurations/dialog/prefix-dialog/prefix-dialog.component';
import { RemoteCatalogueDialogComponent } from './admin-configurations/dialog/remoteCatalogue-dialog/remoteCatalogue-dialog.component';



@NgModule({
  declarations: [CataloguesListComponent, AddCatalogueComponent, RemoteCataloguesComponent, DataletsManagementComponent, ShowcaseDialogComponent, AdminConfigurationsComponent, PrefixDialogComponent, RemoteCatalogueDialogComponent],
  
imports: [
    CommonModule,
    AdminRoutingModule,
    NbDialogModule.forChild(),
    NbFormFieldModule,
    NbTagModule,
    NbIconModule,
    NbInputModule,
    NbSpinnerModule,
    NbListModule,
    NbCardModule,
    NbTooltipModule,
    NbToastrModule,
    NbAccordionModule,
    NbCheckboxModule,
    NbDialogModule.forChild(),
    NbActionsModule,
    NbSelectModule,

    NbTreeGridModule,
    NbToggleModule,
    NbEvaIconsModule,
    NbButtonModule,
    
    FormsModule,

    NbUserModule,
    NgxEchartsModule,
    NbTableModule,
    ThemeModule,
    Ng2SmartTableModule,
  ]
})
export class AdminModule { 
	
	toggleNgModel = true;
	
}
