import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'ngx-about',
  template: `
  <router-outlet></router-outlet>
`,
})
export class AboutComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
