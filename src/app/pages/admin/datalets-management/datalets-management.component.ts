import { Component, OnInit } from '@angular/core';
import { NbDialogService, NbSortDirection, NbSortRequest, NbTreeGridDataSource, NbTreeGridDataSourceBuilder } from '@nebular/theme';
import { CataloguesServiceService } from '../catalogues-service.service';
import { DataletDialogComponent } from './dialog/datalet-dialog.component';
import { RefreshService } from '../../services/refresh.service';

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
	
  constructor(private dataSourceBuilder: NbTreeGridDataSourceBuilder<FSEntry>,
		private restApi:CataloguesServiceService,
		private dialogService: NbDialogService,
    private refreshService: RefreshService, ) { }

    data: TreeNode<FSEntry>[] = [];

    defaultColumns = [ 'title', 'nodeID', 'datasetID', 'distributionID', 'registerDate', 'views', 'lastSeenDate'];
    iconColumn = ' ';
    allColumns = [ ...this.defaultColumns, ...this.iconColumn ];
  
    dataSource: NbTreeGridDataSource<FSEntry>;
  
    sortColumn: string;
    sortDirection: NbSortDirection = NbSortDirection.NONE;

  ngOnInit(): void {
    this.refreshService.refreshPageOnce('admin-configuration');
    this.listDatalets();
  }

  listDatalets(){
		this.data = [];

		this.restApi.listDatalets().subscribe((data: any) => {
      console.log(data);
			data.forEach(element => {
				this.data.push({ data: element });
			});
			this.dataSource = this.dataSourceBuilder.create(this.data);
		})
  }


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

  deleteDatalet(id: string, nodeID: string, datasetID: string, distributionID: string){
    if(confirm("Are you sure to delete this datalet?")) {
      this.restApi.deleteDatalet(id, nodeID, datasetID, distributionID).subscribe((data: any) => {
        this.listDatalets();
      });
    }
  }

	handleIFrameDataletOpenModal(datalet) {
		
		this.dialogService.open(DataletDialogComponent, {
      context: {
        title: 'Create new prefix',
        datalet: datalet
      },
    })
	}


}
