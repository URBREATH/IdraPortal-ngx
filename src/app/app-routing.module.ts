import { ExtraOptions, RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { NbAuthComponent } from '@nebular/auth';
import { AuthLoginComponent } from './pages/auth/login/auth-login.component';
import { AuthCallbackComponent } from './pages/auth/callback/auth-callback.component';
import { AuthLogoutComponent } from './pages/auth/logout/auth-logout.component';

export const routes: Routes = [
  {
    path: 'pages',
    loadChildren: () => import('./pages/pages.module')
      .then(m => m.PagesModule),
    // canActivate: [AuthGuard]
  },
  {
    path: 'keycloak-auth',
    component: NbAuthComponent,
    children: [
      {
        path: '',
        component: AuthLoginComponent,
      },
      {
        path: 'callback',
        component: AuthCallbackComponent,
      },
      {
        path: 'logout',
        component: AuthLogoutComponent,
      }
    ]
  },
  { path: '', redirectTo: 'pages', pathMatch: 'full' },
  { path: '**', redirectTo: 'pages' },
];

const config: ExtraOptions = {
  useHash: false,
};

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      paramsInheritanceStrategy: 'always',
      // …any other global options
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {
}

export class NgxAuthRoutingModule {
  
}