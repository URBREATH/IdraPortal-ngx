import { Component, OnInit } from '@angular/core';

@Component({
  styleUrls: ['./embedded-layout.component.scss'],
  selector: 'ngx-embedded-layout',
  templateUrl: './embedded-layout.component.html',
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
