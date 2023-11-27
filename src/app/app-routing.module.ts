import { ExtraOptions, RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { NbAuthComponent } from '@nebular/auth';
import { AuthLoginComponent } from './auth/login/auth-login.component';
import { AuthCallbackComponent } from './auth/callback/auth-callback.component';
import { AuthGuard } from './auth/services/auth.guard';
import { AuthLogoutComponent } from './auth/logout/auth-logout.component';

export const routes: Routes = [
  {
    path: 'pages',
    loadChildren: () => import('./pages/pages.module')
      .then(m => m.PagesModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'auth',
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
  imports: [RouterModule.forRoot(routes, config)],
  exports: [RouterModule],
})
export class AppRoutingModule {
}
