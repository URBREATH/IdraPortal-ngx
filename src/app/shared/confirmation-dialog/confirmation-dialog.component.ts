import { Component, Input } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';

@Component({
  selector: 'ngx-confirmation-dialog',
  template: `
    <nb-card>
      <nb-card-header>{{ title }}</nb-card-header>
      <nb-card-body>
        <p>{{ message }}</p>
      </nb-card-body>
      <nb-card-footer class="d-flex justify-content-end">
        <button nbButton *ngIf="showCancelButton" status="basic" class="mr-2" (click)="cancel()">Cancel</button>
        <button nbButton status="danger" (click)="confirm()">{{ confirmButtonText || 'Confirm' }}</button>
      </nb-card-footer>
    </nb-card>
  `,
  styles: [`
    nb-card { max-width: 600px; }
  `]
})
export class ConfirmationDialogComponent {
  @Input() title: string = 'Confirmation';
  @Input() message: string = 'Are you sure?';
  @Input() confirmButtonText: string = 'Ok';
  @Input() showCancelButton: boolean = true;

  
  constructor(protected dialogRef: NbDialogRef<ConfirmationDialogComponent>) {}
  
  confirm() {
    this.dialogRef.close(true);
  }
  
  cancel() {
    this.dialogRef.close(false);
  }
}
