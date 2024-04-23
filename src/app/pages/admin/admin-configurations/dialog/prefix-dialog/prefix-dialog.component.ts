import { Component, Input } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';

@Component({
  selector: 'ngx-prefix-dialog',
  templateUrl: 'prefix-dialog.component.html',
  styleUrls: ['prefix-dialog.component.scss'],
})
export class PrefixDialogComponent {

  @Input() title: string;
	prefix: string = '';
	namespace: string = '';
  action: string = '';

  constructor(protected ref: NbDialogRef<PrefixDialogComponent>) {}

  dismiss(prefix, namespace) {
    return this.ref.close({prefix, namespace});
  } 
}
