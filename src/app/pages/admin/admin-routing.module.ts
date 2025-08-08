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
import { AuthGuard } from '../auth/auth.guard';

const routes: Routes = [
{
    path: 'adminCatalogues',
    component: CataloguesListComponent,
    canActivate: [AuthGuard]
  },
{
    path: 'dataletsManagement',
    component: DataletsManagementComponent,
    canActivate: [AuthGuard]
  },
{
  path:'adminCatalogues/addCatalogue',
  component: AddCatalogueComponent,
  canActivate: [AuthGuard]
},
{
  path:'adminCatalogues/remoteCatalogues',
  component: RemoteCataloguesComponent,
  canActivate: [AuthGuard]
},
{
  path:'configuration',
  component: AdminConfigurationsComponent,
  canActivate: [AuthGuard]
},
{
  path: 'datasets-ngsi',
  component: DatasetsNgsiComponent,
  canActivate: [AuthGuard]
},
{
  path: 'datasets-ngsi/editor',
  component: DatasetsNgsiEditorComponent,
  canActivate: [AuthGuard]
},
{
  path: 'models-tools',
  component: ModelsToolsComponent,
  canActivate: [AuthGuard]
},
{
  path: 'models-tools/editor',
  component: ModelsToolsEditorComponent,
  canActivate: [AuthGuard]
},
{
  path: 'data-sources',
  component: DataSourcesComponent,
  canActivate: [AuthGuard]
},
{
  path: 'data-sources/editor',
  component: DataSourcesEditorComponent,
  canActivate: [AuthGuard]
}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [AuthGuard] // Add this if not using providedIn: 'root'
})
export class AdminRoutingModule { }


