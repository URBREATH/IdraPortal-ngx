import { NgModule } from '@angular/core';
import { CardLinksComponent } from './card-links/card-links.component';
import { IframesComponent } from './iframes/iframes.component';
import { ExternalAppComponent } from './external-app.component';
import { ThemeModule } from '../../@theme/theme.module';
import { ExternalAppRoutingModule } from './external-app-routing.module';
import { NbCardModule } from '@nebular/theme';
import { MatCardModule } from '@angular/material/card';

const components = [
  ExternalAppComponent,
  CardLinksComponent,
  IframesComponent,
];

@NgModule({
  declarations: [...components],
  imports: [
    ThemeModule,
    ExternalAppRoutingModule,
    NbCardModule,
    MatCardModule
  ]
})
export class ExternalAppModule { }
