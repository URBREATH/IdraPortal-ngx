import { Component, Input } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';

@Component({
  selector: 'ngx-prefix-dialog',
  templateUrl: 'datalet-dialog.component.html',
  styleUrls: ['datalet-dialog.component.scss'],
})
export class DataletDialogComponent {

    @Input() 
    title: string;
    datalet: string = '';

    constructor(protected ref: NbDialogRef<DataletDialogComponent>) {}

    dismiss() {
        return this.ref.close();
    } 
    
    ngOnInit(){
      document.getElementById('bodyDatalet').innerHTML = this.datalet;
    }
}
