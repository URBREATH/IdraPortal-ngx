import { Component, OnInit } from '@angular/core';
import { NbDialogService, NbSortDirection, NbSortRequest, NbTreeGridDataSource, NbTreeGridDataSourceBuilder } from '@nebular/theme';
import { CataloguesServiceService } from '../catalogues-service.service';
import { ODMSCatalogue } from '../../data-catalogue/model/odmscatalogue';

import { Output, EventEmitter} from '@angular/core';
import {formatDate } from '@angular/common';
import { ShowcaseDialogComponent } from './dialog/showcase-dialog/showcase-dialog.component';
import { Router } from '@angular/router';
import { SharedService } from '../../services/shared.service';
import { ODMSCatalogueComplete } from '../../data-catalogue/model/odmscataloguecomplete';


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
  Status: string;
  Datasets: number;
  UpdatePeriod: string;
  LastUpdate: string;
  id: string;
  index: number;
  isActive: boolean;
  synchLock: string;
}



@Component({
  selector: 'ngx-catalogues-list',
  templateUrl: './catalogues-list.component.html',
  styleUrls: ['./catalogues-list.component.scss']
})


export class CataloguesListComponent implements OnInit {
   cataloguesInfos: Array<ODMSCatalogueComplete>=[]
   loading=false;
   id=0;

	totalCatalogues;

   cataloguesMoreInfos: ODMSCatalogue
   data: TreeNode<FSEntry>[] = [];

   
   message : string = "create";
   @Output() messageEvent  = new EventEmitter<string>();



    constructor(private dataSourceBuilder: NbTreeGridDataSourceBuilder<FSEntry>, 
		private restApi:CataloguesServiceService,
		private dialogService: NbDialogService,
		private router: Router,
		private sharedService: SharedService) {
		
	}


	ngOnInit(): void {

		this.loadCatalogue();
	}

	loadCatalogue(){
		this.data = [];
		// this.dataSource = this.dataSourceBuilder.create(this.data);
		this.loading=true

		this.restApi.getAllCataloguesInfo().subscribe(infos =>{

			this.cataloguesInfos = infos;
			console.log("cataloguesInfos: ",this.cataloguesInfos)
			this.totalCatalogues = this.cataloguesInfos.length;
			for(let i=0; i<infos.length; i++){
				// push to this.data the info of the catalogues
				let level = this.getLevel(infos[i].nodeType);
				console.log("data: ",infos[i])
				this.data.push({
					data: { Name: infos[i].name, Country: infos[i].country, Type: infos[i].nodeType, Level: level, Status: infos[i].nodeState, Datasets: infos[i].datasetCount, UpdatePeriod: '1 week', LastUpdate: formatDate(infos[i].lastUpdateDate, 'yyyy-MM-dd HH:mm:ss', 'en-US'), id: infos[i].id, index: i, isActive: infos[i].isActive, synchLock: infos[i].synchLock},
				});
				this.dataSource = this.dataSourceBuilder.create(this.data);
			}
		},err=>{
			console.log(err);
			this.loading=false;
		})
	}


	setMode(){
		this.messageEvent.emit(this.message);
		console.log("\n HAI PREMUTO ADD");
	}



	getLevel(nodeType: string): string {
			switch(nodeType){
				case 'CKAN':
					//federationLevel='LEVEL_3';
					return "3";
				case 'DKAN':
					//node.federationLevel='LEVEL_2';
					return "2";
				case 'SOCRATA':
					//node.federationLevel='LEVEL_2';
					return "2";
				case 'SPOD':
					//node.federationLevel='LEVEL_2';
					return "2";
				case 'WEB':
					//node.federationLevel='LEVEL_2';
					return "2";
				case 'DCATDUMP':
					//if(node.dumpURL!=''){
						//node.federationLevel='LEVEL_2';
						return "2";
					//}
					//else{
						//node.federationLevel='LEVEL_4';
						//return "4";
					//}

				case 'ORION':
					//node.federationLevel='LEVEL_4';
					return "4";
				case 'SPARQL':
					//node.federationLevel='LEVEL_4';
					return "4";
				case 'OPENDATASOFT':
				case 'JUNAR':	
					//node.federationLevel='LEVEL_2';
					return "2";
				default:
					break;
				}
	}

	// ------------------------- TABLE
	customColumn = 'isActive';
	defaultColumns = [ 'Name', 'Country', 'Type', 'Level', 'Status', 'Datasets', 'UpdatePeriod', 'LastUpdate', 'id'];
	iconColumn = ' ';
	allColumns = [ this.customColumn, ...this.defaultColumns, ...this.iconColumn ];

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
	
    downloadDump(name, id){
	var download_url = "/Idra/api/v1/administration/dcat-ap/dump/download/";
		if(id != null){
			download_url += id.toString();
		}
		if(name == null){
			name = "Federated Catalogues"
		}
		this.restApi.getDump(download_url,name);
	};
  //-------------------------------------------------------------

	disableOnLoading(index : number) {
		this.data[index].data.Status = "LOADING";
	}

	enableOnFinish(index : number) {
		setTimeout(() => {
			this.data[index].data.Status = "ONLINE";
		}, 1000);
	}

	syncCatalogue(id : string, index : number){
		this.disableOnLoading(index);
		this.restApi.syncRemoteCatalogue(id)
		.finally(() => {
			setTimeout(() => {
				this.loadCatalogue();
			}, 5000);
		})
	}

	deleteCatalogue(id : string, index : number){
		this.disableOnLoading(index);
		this.restApi.deleteCatalogue(id)
		.finally(() => {
			setTimeout(() => {
				this.loadCatalogue();
			}, 1000);
		})
	}

	activeCatalogue(id : string, index : number, active: boolean){
		if(active){
			this.disableOnLoading(index);
			this.dialogService.open(ShowcaseDialogComponent, {
				context: {
				  title: 'Deactivate Catalogue Consip OpenData?',
				  body: 'Chose KEEP DATASETS in order to keep dataset in cache'
				},
			  }).onClose.subscribe(res => {
				if(res == 1)
					this.restApi.deactiveCatalogue(id,true)
					.finally(() => {
						setTimeout(() => {
							this.loadCatalogue();
						}, 1000);
					})
				else if(res == 0)
					this.restApi.deactiveCatalogue(id,false)
					.finally(() => {
						setTimeout(() => {
							this.loadCatalogue();
						}, 1000);
					})
				return
			  });
			return
		}
		this.disableOnLoading(index);
		this.restApi.activeCatalogue(id)
		.finally(() => {
			setTimeout(() => {
				this.loadCatalogue();
			}, 1000);
		})
	}

	async sendMqaAnalisysCatalogue(id : String, index) : Promise<void>{
		this.disableOnLoading(index);
		
		await this.restApi.submitAnalisysJSON(id)
		.finally(() => {
				this.enableOnFinish(index);
		})
	}

	modifyCatalogue(id : string){
		// navigate to addCatalogue
		this.router.navigate(['/pages/administration/adminCatalogues/addCatalogue'], { queryParams: { modifyId: id } });
	}
}
