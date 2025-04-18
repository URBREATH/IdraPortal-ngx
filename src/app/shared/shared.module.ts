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
import { DistributionImportDialogComponent } from './distribution-import-dialog/distribution-import-dialog.component';

@NgModule({
  declarations: [
    ConfirmationDialogComponent,
    MapDialogComponent,
    DistributionImportDialogComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NbCardModule,
    NbButtonModule,
    NbIconModule,
    NbListModule,
    NbCheckboxModule,
    NbInputModule
  ],
  exports: [
    ConfirmationDialogComponent,
    MapDialogComponent,
    DistributionImportDialogComponent
  ]
})
export class SharedModule { }