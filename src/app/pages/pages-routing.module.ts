import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';

import { PagesComponent } from './pages.component';
import { NotFoundComponent } from './miscellaneous/not-found/not-found.component';
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
      path: 'tecnalia',
      loadChildren: () => import('./tecnalia-module/tecnalia-module.module')
        .then(m => m.TecnaliaModuleModule),
    },
    {
      path: 'external-app',
      loadChildren: () => import('./external-app/external-app.module')
        .then(m => m.ExternalAppModule),
    },
    {
      path: 'about',
      loadChildren: () => import('./about/about.module')
        .then(m => m.AboutModule),
    },
    {
      path: 'ui-features',
      loadChildren: () => import('./ui-features/ui-features.module')
        .then(m => m.UiFeaturesModule),
    },
    {
      path: 'maps',
      loadChildren: () => import('./maps/maps.module')
        .then(m => m.MapsModule),
    },
    {
      path: 'charts',
      loadChildren: () => import('./charts/charts.module')
        .then(m => m.ChartsModule),
    },
    {
      path: 'datasets',
      loadChildren: () => import('./data-catalogue/data-catalogue.module')
        .then(m => m.DataCatalogueModule),
    },
//-------------------- NEW
     {
      path: 'administration',
      loadChildren: () => import('./admin/admin-module.module')
        .then(m => m.AdminModule),
    },
    {
      path: 'auth',
      component: NbAuthComponent,
      children: [
        {
          path: 'login',
          component: NbLoginComponent,
          // loadChildren: () => import('./auth/login/login.module')
          //   .then(m => m.NgxLoginModule),
        },
        {
          path: 'logout',
          component: NbLogoutComponent,
          // loadChildren: () => import('./auth/login/login.module')
          //   .then(m => m.NgxLoginModule),
        },
    ],
    },
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
