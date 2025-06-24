import { Component, OnInit } from '@angular/core';

@Component({
  styleUrls: ['./embedded-layout.component.scss'],
  selector: 'ngx-embedded-layout',
  template:  `
    <nb-layout windowMode>
      <nb-layout-column>
        <ng-content select="router-outlet"></ng-content>
      </nb-layout-column>
    </nb-layout>
  `,
})
export class EmbeddedLayoutComponent implements OnInit {

  ngOnInit() {
    // Hide the global spinner when the component initializes
    this.hideGlobalSpinner();
  }

  private hideGlobalSpinner() {
    const spinner = document.getElementById('nb-global-spinner');
    if (spinner) {
      spinner.remove();
    }
  }
}
