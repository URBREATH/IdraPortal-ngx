import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router'; // Add this import
// import { NbAccessChecker } from '@nebular/security';
import { NbMenuItem } from '@nebular/theme';
import { ConfigService } from 'ngx-config-json';
import { Subscription } from 'rxjs';

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
export class PagesComponent implements OnInit, OnDestroy {

  menu: MenuItem[];
  userRoles: string[];
  isEmbedded: boolean = false;
  private subscriptions: Subscription[] = [];
  
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
    console.log('PagesComponent: Initializing...');
    
    // Subscribe to embedded state from SharedService
    const embeddedSubscription = this.sharedService.embeddedState$.subscribe(isEmbedded => {
      console.log('PagesComponent: Embedded state changed to:', isEmbedded);
      this.isEmbedded = isEmbedded;
    });
    this.subscriptions.push(embeddedSubscription);

    // Also check embedded status from URL query parameter (fallback)
    this.route.queryParams.subscribe(params => {
      console.log('PagesComponent: Route params:', params);
      if (params['embedded'] === 'true' && !this.isEmbedded) {
        console.log('PagesComponent: Setting embedded state from URL param');
        this.sharedService.updateEmbeddedState(true);
      }
    });

    this.menu = MENU_ITEMS;

    this.translateService.onLangChange.subscribe(event => this.translateMenuItems());
    this.translateMenuItems();
    this.translateService.use('en');
    
    if (this.configService.config['enableAuthentication']) {
      console.log('PagesComponent: Authentication enabled, setting up auth menu items');
      this.authMenuItems();
    }
    
    console.log('PagesComponent: Initialization complete');
  }

  ngOnDestroy() {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
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
