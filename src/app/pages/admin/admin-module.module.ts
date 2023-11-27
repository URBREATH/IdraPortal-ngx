import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { CataloguesListComponent } from './catalogues-list/catalogues-list.component';
import { NbAccordionModule, NbActionsModule, NbCardModule, NbDialogModule, NbFormFieldModule, NbIconModule, NbInputModule, NbListModule, NbSelectModule, NbSpinnerModule, NbTagModule, NbToastrModule, NbTooltipModule, NbTreeGridModule, NbToggleModule, NbButtonModule } from '@nebular/theme';
//import { AdminComponent } from './admin.component';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { AddCatalogueComponent } from './add-catalogue/add-catalogue.component';
import { RemoteCataloguesComponent } from './remote-catalogues/remote-catalogues.component';
import { DataletsManagementComponent } from './datalets-management/datalets-management.component';

import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [CataloguesListComponent, AddCatalogueComponent, RemoteCataloguesComponent, DataletsManagementComponent],
  
imports: [
    CommonModule,
    AdminRoutingModule,

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
    NbDialogModule.forChild(),
    NbActionsModule,
    NbSelectModule,

	NbTreeGridModule,
	NbToggleModule,
	NbEvaIconsModule,
	NbButtonModule,
	
	FormsModule
  ]
})
export class AdminModule { 
	
	toggleNgModel = true;
	
}
