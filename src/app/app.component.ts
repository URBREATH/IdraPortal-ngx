/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { Component, OnInit } from '@angular/core';
import { ConfigService } from 'ngx-config-json';
import { HttpClient } from '@angular/common/http';
import { NbPasswordAuthStrategy } from './@theme/components/auth/public_api';

@Component({
  selector: 'ngx-app',
  template: '<router-outlet></router-outlet>',
})
export class AppComponent {

  constructor(
     oauthStrategy: NbPasswordAuthStrategy,
    private http : HttpClient,
    private config:ConfigService<Record<string, any>>,
    ) {
      
      oauthStrategy.setOptions({name: 'email',
      baseEndpoint: this.config.config["idra_base_url"] + '/Idra/api/v1/administration',
      login: {
        alwaysFail: false,
        endpoint: '/login',
        method: 'post',
        redirect: {
          success: '/',
          failure: null,
        },
        defaultErrors: ['Username/password combination is not correct, please try again.'],
        defaultMessages: ['You have been successfully logged in.'],
      },
      logout: {
        // ...
        alwaysFail: false,
        endpoint: '/logout',
        method: 'post',
        redirect: {
          success: '/',
          failure: null,
        },
      },
      });
  }

}
