import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ExternalAppComponent } from './external-app.component';
import { CardLinksComponent } from './card-links/card-links.component';
import { IframesComponent } from './iframes/iframes.component';



const routes: Routes = [{
    path: '',
    component: ExternalAppComponent,
    children: [{
        path: 'card-links',
        component: CardLinksComponent,
    }, {
        path: 'iframes',
        component: IframesComponent,
    }
    ],
}];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class ExternalAppRoutingModule { }
