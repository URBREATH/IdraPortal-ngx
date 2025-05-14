import { Component, OnInit } from '@angular/core';
import { RefreshService } from '../services/refresh.service';

@Component({
  selector: 'ngx-data-catalogue',
  template: `
    <router-outlet></router-outlet>
  `,
})
export class DataCatalogueComponent implements OnInit {

  constructor(
    private refreshService: RefreshService,
  ) { }

  ngOnInit(): void {
    this.refreshService.refreshPageOnce('admin-configuration');
  }

}
