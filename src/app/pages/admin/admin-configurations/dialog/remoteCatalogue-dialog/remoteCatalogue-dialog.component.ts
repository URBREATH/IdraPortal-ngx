import { Component, Input } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';

@Component({
  selector: 'ngx-remoteCatalogue-dialog',
  templateUrl: 'remoteCatalogue-dialog.component.html',
  styleUrls: ['remoteCatalogue-dialog.component.scss'],
})
export class RemoteCatalogueDialogComponent {

  @Input() title: string;
	catalogueName: string = '';
	catalogueURL: string = '';
  action: string = '';
  catalogueType: boolean = false;
	authMethod: string = '';
  username: string = '';
  password: string = '';
  clientID: string = '';
  clientSecret: string = '';
  portalURL: string = '';

  constructor(protected ref: NbDialogRef<RemoteCatalogueDialogComponent>) {}

  dismiss(catalogueName, catalogueURL, type, authMethod, username, password, clientID, clientSecret, portalURL) {
    return this.ref.close({catalogueName, catalogueURL, type, authMethod, username, password, clientID, clientSecret, portalURL});
  } 

  changedTypeHandler(event: any) {
    this.catalogueType = event;
  }

	changedAuthMethodHandler(event: any) {
		this.authMethod = event;
	}
}
