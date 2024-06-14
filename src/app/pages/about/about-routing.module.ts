import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AboutComponent } from './about.component';
import { InfoComponent } from './info/info.component';
import { SiteComponent } from './site/site.component';




const routes: Routes = [{
    path: '',
    component: AboutComponent,
    children: [{
        path: 'info',
        component: InfoComponent,
    }, {
        path: 'project',
        component: SiteComponent,
    }
    ],
}];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class AboutRoutingModule { }
