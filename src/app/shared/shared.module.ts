import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NbCardModule, NbButtonModule, NbIconModule } from '@nebular/theme';
import { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';
import { MapDialogComponent } from './map-dialog/map-dialog.component';

@NgModule({
  declarations: [
    ConfirmationDialogComponent,
    MapDialogComponent
  ],
  imports: [
    CommonModule,
    NbCardModule,
    NbButtonModule,
    NbIconModule
  ],
  exports: [
    ConfirmationDialogComponent,
    MapDialogComponent
  ]
})
export class SharedModule { }