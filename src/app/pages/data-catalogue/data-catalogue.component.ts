import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'ngx-data-catalogue',
  template: `
    <router-outlet></router-outlet>
  `,
})
export class DataCatalogueComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
