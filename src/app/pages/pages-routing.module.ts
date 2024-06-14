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
      path: 'about',
      loadChildren: () => import('./about/about.module')
        .then(m => m.AboutModule),
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
      path: 'mqa',
      loadChildren: () => import('./mqa/mqa.module')
      .then(m => m.MqaModule),
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
