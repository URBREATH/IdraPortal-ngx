import { Component } from '@angular/core';

@Component({
  selector: 'ngx-footer',
  styleUrls: ['./footer.component.scss'],
  template: `
    <span class="created-by">
      <a href="https://idra.readthedocs.io/en/latest/" target="_blank">Idra Open Data Federation Platform</a>
    </span>
  `,
})
export class FooterComponent {
}
