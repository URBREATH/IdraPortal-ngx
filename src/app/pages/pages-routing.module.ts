import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';

import { PagesComponent } from './pages.component';
import { NotFoundComponent } from './miscellaneous/not-found/not-found.component';
import {
  NbAuthComponent as NebularAuthComponent,
  NbLoginComponent as NebularLoginComponent,
  NbLogoutComponent as NebularLogoutComponent
} from '@nebular/auth';
import { NbAuthComponent, NbLoginComponent, NbLogoutComponent } from '../@theme/components/auth/public_api';

const routes: Routes = [{
  path: '',

  component: PagesComponent,
  children: [
    {
      path: 'home',
      loadChildren: () => import('./home/home.module')
        .then(m => m.HomeModule),
    },
    {
      path: 'sparql',
      loadChildren: () => import('./sparql/sparql.module')
      .then(m => m.SparqlModule),
    },
    {
      path: 'about',
      loadChildren: () => import('./about/about.module')
        .then(m => m.AboutModule),
    },
    {
      path: 'catalogues',
      loadChildren: () => import('./catalogues/catalogues.module')
      .then(m => m.CataloguesModule),
    },
    {
      path: 'datasets',
      loadChildren: () => import('./data-catalogue/data-catalogue.module')
        .then(m => m.DataCatalogueModule),
    },
//-------------------- NEW
      {
        path: 'datasets-ngsi/editor',
        loadChildren: () => import('./datasets-ngsi-editor/datasets-ngsi-editor.module')
            .then(m => m.DatasetsNgsiEditorModule),
      },
      {
        path: 'datasets-ngsi',
        loadChildren: () => import('./datasets-ngsi/datasets-ngsi.module')
          .then(m => m.DatasetsNgsiModule),
      },
     {
      path: 'administration',
      loadChildren: () => import('./admin/admin-module.module')
        .then(m => m.AdminModule),
    },
    {
      path: 'mqa',
      loadChildren: () => import('./mqa/mqa.module')
      .then(m => m.MqaModule),
    },
    {
      path: 'statistics',
      loadChildren: () => import('./statistics/statistics.module')
      .then(m => m.StatisticsModule),
    },
    {
      path: 'keycloak-auth',
      component: NebularAuthComponent,
      children: [
        {
          path: 'login',
          component: NebularLoginComponent,
        },
        {
          path: 'logout',
          component: NebularLogoutComponent,
        },
      ],  
    }, 
        {
          path: 'auth',
          component: NbAuthComponent,
          children: [
            {
              path: 'login',
              component: NbLoginComponent,
            },
            {
              path: 'logout',
              component: NbLogoutComponent,
            },
          ]},
    
    
// ---------------------
    { 
      path: '',
      redirectTo: 'home',
      pathMatch: 'full',
    },
    {
      path: '**',
      component: NotFoundComponent,
    },
  ],
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PagesRoutingModule {
}
