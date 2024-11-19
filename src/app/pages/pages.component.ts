import { Component, OnInit } from '@angular/core';
// import { NbAccessChecker } from '@nebular/security';
import { NbMenuItem } from '@nebular/theme';
import { ConfigService } from 'ngx-config-json';

import { MENU_ITEMS } from './pages-menu';
import { NbAccessChecker } from '@nebular/security';
import { NbAuthOAuth2JWTToken, NbAuthService } from '@nebular/auth';

@Component({
  selector: 'ngx-pages',
  styleUrls: ['pages.component.scss'],
  template: `
    <ngx-one-column-layout>
      <nb-menu [items]="menu"></nb-menu>
      <router-outlet></router-outlet>
    </ngx-one-column-layout>
  `,
})
export class PagesComponent implements OnInit {

  menu = MENU_ITEMS;
  userRoles: string[];
  constructor(
     private accessChecker: NbAccessChecker,
    private configService: ConfigService<Record<string, any>>,
    private auth: NbAuthService
    ) {
  }

  ngOnInit() {
/*
    this.menu.map( x=> {
      if( x.data!=undefined && x.data['name']=='administration'){
        x.children.map( y =>{
          if(y.data['name']=='data-catalogue-administration'){
            y.url = `${this.configService.config['idra_base_url')}/${this.configService.config['idra_portal_base_href')}/#/catalogues`
          }

          if(y.data['name']=='idm-administration'){
            y.url = `${this.configService.config['idmBaseURL')}/auth/admin/${this.configService.config['idmRealmName')}/console`
          }
        })
      }
    })
*/
    if (this.configService.config['enableAuthentication']) {
      this.authMenuItems();
    }
  }

  authMenuItems() {
    this.menu.forEach(item => {
      if(item.hidden)
        this.authMenuItem(item);
    });
  }

  authMenuItem(menuItem: NbMenuItem) {

    if (menuItem.data && menuItem.data['name'] ) {
      this.accessChecker.isGranted('view', menuItem.data['name']).subscribe(res =>
       
        menuItem.hidden = !res
       )
     } else {

          menuItem.hidden = true;
     }
     if (!menuItem.hidden && menuItem.children != null ) {
       menuItem.children.forEach(item => {
         item.hidden = menuItem.hidden;
       });
     }
  
  }
}
