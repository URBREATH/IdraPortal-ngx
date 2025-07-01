import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router'; // Add this import
// import { NbAccessChecker } from '@nebular/security';
import { NbMenuItem } from '@nebular/theme';
import { ConfigService } from 'ngx-config-json';

import { MENU_ITEMS } from './pages-menu';
import { NbAccessChecker } from '@nebular/security';
import { NbAuthOAuth2JWTToken, NbAuthService } from '@nebular/auth';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem } from './menu-item';
import { SharedService } from './services/shared.service';

@Component({
  selector: 'ngx-pages',
  styleUrls: ['pages.component.scss'],
  template: `
    <ngx-one-column-layout *ngIf="!isEmbedded">
      <nb-menu [items]="menu"></nb-menu>
      <router-outlet></router-outlet>
    </ngx-one-column-layout>
    <ngx-embedded-layout  *ngIf="isEmbedded">
      <router-outlet></router-outlet>
    </ngx-embedded-layout>
  `,
})
export class PagesComponent implements OnInit {

  menu: MenuItem[];
  userRoles: string[];
  isEmbedded: boolean = false;
  
  constructor(
    private accessChecker: NbAccessChecker,
    private configService: ConfigService<Record<string, any>>,
    private auth: NbAuthService,
    private translateService: TranslateService,
    private sharedService: SharedService,
    private route: ActivatedRoute
  ) {
  }

  ngOnInit() {

    // Read embedded status from URL query parameter
    this.route.queryParams.subscribe(params => {
      this.isEmbedded = params['embedded'] === 'true';
    });

    this.menu = MENU_ITEMS;
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
this.translateService.onLangChange.subscribe(event => this.translateMenuItems());
this.translateMenuItems();
this.translateService.use('en');
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

  authMenuItem(menuItem: MenuItem) {
    this.translateService.use('en');
    this.sharedService.propagateDialogSelectedLanguage("en");
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
  translateMenuItems() {
    this.menu.forEach(item => this.translateMenuItem(item));
  }

  translateMenuItem(menuItem: MenuItem) {
    if (menuItem.children != null) {
      menuItem.children.forEach(item => this.translateMenuItem(item));
    }
    menuItem.title = this.translateService.instant(menuItem.key);
  }
}
