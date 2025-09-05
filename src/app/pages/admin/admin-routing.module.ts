import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CataloguesListComponent } from './catalogues-list/catalogues-list.component';
import { AddCatalogueComponent } from './add-catalogue/add-catalogue.component';
import { RemoteCataloguesComponent } from './remote-catalogues/remote-catalogues.component';
import { DataletsManagementComponent } from './datalets-management/datalets-management.component';
import { AdminConfigurationsComponent } from './admin-configurations/admin-configurations.component';
import { DatasetsNgsiComponent } from './datasets-ngsi/datasets-ngsi.component';
import { ModelsToolsComponent } from './models-tools/models-tools.component';
import { DataSourcesComponent } from './data-sources/data-sources.component';
import { DatasetsNgsiEditorComponent } from './datasets-ngsi-editor/datasets-ngsi-editor.component';
import { ModelsToolsEditorComponent } from './models-tools-editor/models-tools-editor.component';
import { DataSourcesEditorComponent } from './data-sources-editor/data-sources-editor.component';

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
},
{
  path:'configuration',
  component: AdminConfigurationsComponent
},
{
  path: 'datasets-ngsi',
  component: DatasetsNgsiComponent
},
{
  path: 'datasets-ngsi/editor',
  component: DatasetsNgsiEditorComponent
},
{
  path: 'models-tools',
  component: ModelsToolsComponent
},
{
  path: 'models-tools/editor',
  component: ModelsToolsEditorComponent
},
{
  path: 'data-sources',
  component: DataSourcesComponent
},
{
  path: 'data-sources/editor',
  component: DataSourcesEditorComponent
}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }


