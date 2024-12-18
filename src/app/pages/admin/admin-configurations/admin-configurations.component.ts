import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';


//)import { CataloguesListComponent } from '../catalogues-list/catalogues-list.component';
import { CataloguesServiceService } from '../catalogues-service.service';
import { SharedService } from '../../services/shared.service';
import { DomSanitizer } from '@angular/platform-browser';
import { NbDialogService, NbSortDirection, NbSortRequest, NbTreeGridDataSource, NbTreeGridDataSourceBuilder } from '@nebular/theme';

import { Md5 } from 'ts-md5';
import { PrefixDialogComponent } from './dialog/prefix-dialog/prefix-dialog.component';
import { RemoteCatalogueDialogComponent } from './dialog/remoteCatalogue-dialog/remoteCatalogue-dialog.component';
import { RefreshService } from '../../services/refresh.service';
import { TranslateService } from '@ngx-translate/core';

interface TreeNode<T> {
  data: T;
  children?: TreeNode<T>[];
  expanded?: boolean;
}

interface FSEntry {
  Prefix: string;
  Namespace: string;
  id: string;
}

interface FSEntryCat {
  Catalogue: string;
  URL: string;
  editable: boolean;
  isIdra: boolean;
  id: string;
  username: string;
  password: string;
  clientID: string;
  clientSecret: string;
  portal: string
}


@Component({
  selector: 'ngx-admin-configurations',
  templateUrl: './admin-configurations.component.html',
  styleUrls: ['./admin-configurations.component.scss']
})


export class AdminConfigurationsComponent implements OnInit {

  constructor(private dataSourceBuilder: NbTreeGridDataSourceBuilder<FSEntry>,
    private dataSourceBuilderCat: NbTreeGridDataSourceBuilder<FSEntryCat>,
    private router: Router,
    private restApi: CataloguesServiceService,
    private route: ActivatedRoute,
    private sharedService: SharedService,
    private refreshService: RefreshService,
    private sanitizer: DomSanitizer,
    public translation: TranslateService,
    private dialogService: NbDialogService) { }

  data: TreeNode<FSEntry>[] = [];
  dataCat: TreeNode<FSEntryCat>[] = [];
  defaultColumns = ['Prefix', 'Namespace'];
  iconColumn = ' ';
  allColumns = [...this.defaultColumns, ...this.iconColumn];

  defaultColumnsCat = ['Catalogue', 'URL'];
  iconColumnCat = ' ';
  allColumnsCat = [...this.defaultColumnsCat, ...this.iconColumnCat];

  dataSource: NbTreeGridDataSource<FSEntry>;
  dataSourceCat: NbTreeGridDataSource<FSEntryCat>;
  sortColumn: string;
  sortDirection: NbSortDirection = NbSortDirection.NONE;

  updateSort(sortRequest: NbSortRequest): void {
    this.sortColumn = sortRequest.column;
    this.sortDirection = sortRequest.direction;
  }

  getSortDirection(column: string): NbSortDirection {
    if (this.sortColumn === column) {
      return this.sortDirection;
    }
    return NbSortDirection.NONE;
  }

  getShowOn(index: number) {
    const minWithForMultipleColumns = 400;
    const nextColumnStep = 100;
    return minWithForMultipleColumns + (nextColumnStep * index);
  }

  ngOnInit(): void {
    this.refreshService.refreshPageOnce('admin-configuration');
    this.restApi.getConfigurationManagement().subscribe((data: any) => {
      console.log(data);
      this.refreshPeriod = data.refresh_period;
      this.rdfControls = (data.rdf_undefined_content_length == 'true');
      this.rdfMaxSize = (data.rdf_undefined_dimension == 'true');
      this.rdfMaxNumber = data.rdf_max_dimension;
      this.contextBrokerUrl = data.orionUrl;
      if (data.orionUrl == '') {
        this.contextBrokerFederation = false;
      } else {
        this.contextBrokerFederation = true;
      }
    });
    this.listPrefixes();
    this.listRemoteCatalogues();
  }

  listPrefixes() {
    this.data = [];

    this.restApi.listPrefixes().subscribe((data: any) => {
      console.log(data);
      data.forEach(element => {
        this.data.push({ data: { Prefix: element.prefix, Namespace: element.namespace, id: element.id } });
      });
      this.dataSource = this.dataSourceBuilder.create(this.data);
    })
  }

  listRemoteCatalogues() {
    this.dataCat = [];

    this.restApi.listRemoteCatalogues().subscribe((data: any) => {
      console.log(data);
      data.forEach(element => {
        this.dataCat.push({ data: { Catalogue: element.catalogueName, URL: element.URL, editable: element.editable, isIdra: element.isIdra, id: element.id, username: element.username, password: element.password, clientID: element.clientID, clientSecret: element.clientSecret, portal: element.portal } });
      });
      this.dataSourceCat = this.dataSourceBuilderCat.create(this.dataCat);
    })
  }

  refreshPeriod: string = '0';
  rdfControls: boolean = false;
  rdfMaxSize: boolean = false;
  rdfMaxNumber: number = 0;
  contextBrokerFederation: boolean = false;
  contextBrokerUrl: string = '';

  handleClickCatalogues() {
    let json = {
      "refresh_period": this.refreshPeriod,
      "rdf_undefined_content_length": String(this.rdfControls),
      "rdf_undefined_dimension": String(this.rdfMaxSize),
      "rdf_max_dimension": this.rdfMaxNumber.toString(),
      "orionUrl": this.contextBrokerUrl
    };
    this.restApi.updateConfiguration(json).subscribe((data: any) => {
      console.log(data);
    });
  }

  handleContextBrokerFederation() {
    if (this.contextBrokerFederation == false)
      this.contextBrokerUrl = ''
  }

  oldPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  handleUpdatePassword() {
    if (this.newPassword != this.confirmPassword) {
      alert('New password and confirm password do not match');
      return;
    }
    // retreive username from session
    let username = localStorage.getItem('username');
    let json = {
      "oldPassword": Md5.hashStr(this.oldPassword),
      "newPassword": this.newPassword,
      "newPasswordConfirm": this.confirmPassword,
      "username": username,
    };
    this.restApi.updatePassword(json).subscribe((data: any) => {
      console.log(data);
    });
  }

  handleSparqlPrefixOpenModal() {

    this.dialogService.open(PrefixDialogComponent, {
      context: {
        title: 'Create new prefix',
        action: 'ADD'
      },
    }).onClose.subscribe(res => {
      if (res.prefix != 0 && res.namespace != 0) {
        console.log(res);
        let json = {
          "prefix": res.prefix,
          "namespace": res.namespace
        };
        this.restApi.createPrefix(json).subscribe((data: any) => {
          this.listPrefixes();
          console.log(data);
        });
      }
    });
  }

  handleSparqlPrefixDelete(id: string) {

    if (confirm("Are you sure you want to delete this element?")) {
      this.restApi.deletePrefix(id).subscribe((data: any) => {
        console.log(data);
        this.listPrefixes();
      });
    }
  }

  handleSparqlPrefixEdit(id: string, prefix: string, namespace: string) {
    this.dialogService.open(PrefixDialogComponent, {
      context: {
        title: 'Modify new prefix',
        action: 'MODIFY',
        prefix: prefix,
        namespace: namespace
      },
    }).onClose.subscribe(res => {
      if (res.prefix != 0 && res.namespace != 0) {
        console.log(res);
        let json = {
          "prefix": res.prefix,
          "namespace": res.namespace,
          "id": id
        };
        this.restApi.modifyPrefix(json, id).subscribe((data: any) => {
          this.listPrefixes();
          console.log(data);
        });
      }
    });
  }

  handleRemoteCatalogueOpenModal() {
    this.dialogService.open(RemoteCatalogueDialogComponent, {
      context: {
        title: 'Add new remote catalogue',
        action: 'ADD',
      },
    }).onClose.subscribe(res => {
      if (res.catalogueName != 0 && res.catalogueURL != 0 && res.catalogueType != 0) {
        console.log(res);
        let json = {
          "catalogueName": res.catalogueName,
          "URL": res.catalogueURL,
          "isIdra": res.type,
          "editable": true,
        };
        if (res.type == true && res.authMethod == 1) {
          json["username"] = res.username;
          json["password"] = res.password;
        }
        if (res.type == true && res.authMethod == 2) {
          json["username"] = res.username;
          json["password"] = Md5.hashStr(res.password);
          json["clientID"] = res.clientID;
          json["clientSecret"] = res.clientSecret;
          json["portal"] = res.portalURL;
        }
        this.restApi.createRemoteCatalogue(json).subscribe((data: any) => {
          this.listRemoteCatalogues();
          console.log(data);
        });
      }
    });
  }

  handleEditRemoteCatalogueOpenModal(obj: any) {
    this.dialogService.open(RemoteCatalogueDialogComponent, {
      context: {
        title: 'Modify remote catalogue',
        action: 'MODIFY',
        catalogueName: obj.Catalogue,
        catalogueURL: obj.URL,
        catalogueType: obj.isIdra,
        authMethod: obj.clientID ? '2' : obj.username ? '1' : '0',
        username: obj.username,
        password: obj.password,
        clientID: obj.clientID,
        clientSecret: obj.clientSecret,
        portalURL: obj.portal,
      },
    }).onClose.subscribe(res => {
      if (res.catalogueName != 0 && res.catalogueURL != 0 && res.catalogueType != 0) {
        console.log(res);
        let json = {
          "catalogueName": res.catalogueName,
          "URL": res.catalogueURL,
          "isIdra": res.type,
          "editable": true,
        };
        if (res.type == true && res.authMethod == 1) {
          json["username"] = res.username;
          json["password"] = Md5.hashStr(res.password);
        }
        if (res.type == true && res.authMethod == 2) {
          json["username"] = res.username;
          json["password"] = Md5.hashStr(res.password);
          json["clientID"] = res.clientID;
          json["clientSecret"] = res.clientSecret;
          json["portal"] = res.portalURL;
        }
        this.restApi.modifyRemoteCatalogue(json, obj.id).subscribe((data: any) => {
          this.listRemoteCatalogues();
          console.log(data);
        });
      }
    });
  }

  handleRemoteCataloguDelete(id: string) {
    if (confirm("Are you sure you want to delete this element?")) {
      this.restApi.deleteRemoteCatalogue(id).subscribe((data: any) => {
        console.log(data);
        this.listRemoteCatalogues();
      });
    }
  }

}
