import { Component, OnInit } from '@angular/core';
import { NbSortDirection, NbSortRequest, NbTreeGridDataSource, NbTreeGridDataSourceBuilder } from '@nebular/theme';
import { CataloguesServiceService } from '../catalogues-service.service';

interface TreeNode<T> {
  data: T;
  children?: TreeNode<T>[];
  expanded?: boolean;
}

interface FSEntry {
  id: string;
  nodeID: string;
  datasetID: string;
  distributionID: string;
  datalet_html: string;
  title: string;
  customTitle: boolean;
  registerDate: string;
  lastSeenDate: string;
  views: number;
}

@Component({
  selector: 'ngx-datalets-management',
  templateUrl: './datalets-management.component.html',
  styleUrls: ['./datalets-management.component.scss']
})
export class DataletsManagementComponent implements OnInit {
	
  data: TreeNode<FSEntry>[] = [];


  constructor(private dataSourceBuilder: NbTreeGridDataSourceBuilder<FSEntry>,
		private restApi:CataloguesServiceService, ) { }

  ngOnInit(): void {
	
    this.restApi.listDatalets().subscribe((data: any) => {
      console.log(data);
      data.forEach(element => {
        this.data.push({ data: element });
      });
      // this.data = data;
      this.dataSource = this.dataSourceBuilder.create(data);
    });
	//costruisco la tabella
	
  }

  // ------------------------- TABLE
  // defaultColumns = [ 'Title', 'Catalogue', 'Dataset', 'Distribution', 'Registerd', 'Views', 'Last Seen'];
  defaultColumns = [ 'title', 'nodeID', 'datasetID', 'distributionID', 'registerDate', 'views', 'lastSeenDate'];
	iconColumn = ' ';
	allColumns = [ ...this.defaultColumns ];

  dataSource: NbTreeGridDataSource<FSEntry>;

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
  //-------------------------------------------------------------




}
