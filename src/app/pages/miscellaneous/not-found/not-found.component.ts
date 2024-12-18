import { NbMenuService } from '@nebular/theme';
import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ngx-not-found',
  styleUrls: ['./not-found.component.scss'],
  templateUrl: './not-found.component.html',
})
export class NotFoundComponent {

  constructor(private menuService: NbMenuService,public translation: TranslateService,) {
  }

  goToHome() {
    this.menuService.navigateHome();
  }
}
