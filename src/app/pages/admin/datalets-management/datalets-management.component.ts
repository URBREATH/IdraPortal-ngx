import { Component, OnInit } from '@angular/core';
import { NbSortDirection, NbSortRequest, NbTreeGridDataSource, NbTreeGridDataSourceBuilder } from '@nebular/theme';

interface TreeNode<T> {
  data: T;
  children?: TreeNode<T>[];
  expanded?: boolean;
}

interface FSEntry {
  Name: string;
  Country: string;
  Type: string;
  Level: string;
  Host: string;
}

@Component({
  selector: 'ngx-datalets-management',
  templateUrl: './datalets-management.component.html',
  styleUrls: ['./datalets-management.component.scss']
})
export class DataletsManagementComponent implements OnInit {
	
  data: TreeNode<FSEntry>[] = [];


  constructor(private dataSourceBuilder: NbTreeGridDataSourceBuilder<FSEntry>,) { }

  ngOnInit(): void {
	
	//costruisco la tabella
	this.dataSource = this.dataSourceBuilder.create(this.data);
	
  }

  // ------------------------- TABLE
  defaultColumns = [ 'Title', 'Catalogue', 'Dataset', 'Distribution', 'Registerd', 'Views', 'Last Seen'];
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
