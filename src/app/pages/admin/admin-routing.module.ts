import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CataloguesListComponent } from './catalogues-list/catalogues-list.component';

import { AddCatalogueComponent } from './add-catalogue/add-catalogue.component';
import { RemoteCataloguesComponent } from './remote-catalogues/remote-catalogues.component';
import { DataletsManagementComponent } from './datalets-management/datalets-management.component';

const routes: Routes = [
{
    path: 'adminCatalogues',
    component: CataloguesListComponent
  },
{
    path: 'dataletsManagement',
    component: DataletsManagementComponent
  },
{
  path:'adminCatalogues/addCatalogue',
  component: AddCatalogueComponent
},
{
  path:'adminCatalogues/remoteCatalogues',
  component: RemoteCataloguesComponent
}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }


