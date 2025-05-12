import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { 
  NbCardModule, 
  NbButtonModule, 
  NbIconModule, 
  NbListModule,
  NbCheckboxModule,
  NbInputModule 
} from '@nebular/theme';
import { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';
import { MapDialogComponent } from './map-dialog/map-dialog.component';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    ConfirmationDialogComponent,
    MapDialogComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NbCardModule,
    NbButtonModule,
    NbIconModule,
    NbListModule,
    NbCheckboxModule,
    NbInputModule,
    TranslateModule,
  ],
  exports: [
    ConfirmationDialogComponent,
    MapDialogComponent,
  ]
})
export class SharedModule { }