import { Component, OnInit } from '@angular/core';
import { NbSortDirection, NbSortRequest, NbTreeGridDataSource, NbTreeGridDataSourceBuilder } from '@nebular/theme';
import { CataloguesServiceService } from '../catalogues-service.service';
import { ODMSCatalogueInfo } from '../../data-catalogue/model/odmscatalogue-info';
import { ODMSCatalogue } from '../../data-catalogue/model/odmscatalogue';

import * as remoteCatalogueData from '../../../../assets/remoteCatalogues.json';
import { Router } from '@angular/router';


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
  index: number;
  alreadyLoaded: boolean;
}


@Component({
  selector: 'ngx-remote-catalogues',
  templateUrl: './remote-catalogues.component.html',
  styleUrls: ['./remote-catalogues.component.scss']
})
export class RemoteCataloguesComponent implements OnInit {
	
   cataloguesInfos: Array<ODMSCatalogueInfo>=[]
   loading=false;
   id=0;

   totalCatalogues;
   cataloguesMoreInfos: ODMSCatalogue
   data: TreeNode<FSEntry>[] = [];

   activeMode = [{text:'',value:true},{text:'',value:false}];
   allRemCat = []
//    allRemCatJson = [];
   allRemCatJson: any = remoteCatalogueData

  constructor(private dataSourceBuilder: NbTreeGridDataSourceBuilder<FSEntry>, private restApi:CataloguesServiceService, private router: Router) { }

  ngOnInit(): void {
	
	
	// GET REM CATALOGUES LIST
	this.restApi.getAllRemCat().subscribe(infos =>{
				console.log("\nCHIAMATA API GET ALL REM CAT. infos: "+infos[0].URL);
				this.allRemCat = infos;
	
	},err=>{
      console.log(err);
    })
	this.allRemCatJson = this.allRemCatJson.default
	// console.log("\nREM CAT 1: "+this.allRemCatJson[0].name);

	let allCatalogues = [];
	this.restApi.getAllCataloguesInfo().subscribe(infos =>{
		allCatalogues = infos;
		for (let k = 0; k < this.allRemCatJson.length; k++) {
				
		// console.log("\nLOCATION: "+this.allRemCatJson[k].host);
		//let nameHost = "<a href=\""+infos2.host+"\\\">"+infos2.name+"<a/>";
		
		let level = this.getLevel(this.allRemCatJson[k].nodeType);
		
		let  alreadyLoaded = false;
		for (let i = 0; i < allCatalogues.length; i++) {
			if(allCatalogues[i].host == this.allRemCatJson[k].host){
				alreadyLoaded = true;
				break;
			}
		}
		
		let data2 = [
				{
				data: { Name: this.allRemCatJson[k].name, Country: this.allRemCatJson[k].country, Type: this.allRemCatJson[k].nodeType, Level: level, Host: this.allRemCatJson[k].host, index: k, alreadyLoaded: alreadyLoaded}
			}
			];
		
		if(this.data.length==0){
			
			this.data = [
				{
				data: { Name: this.allRemCatJson[k].name, Country: this.allRemCatJson[k].country, Type: this.allRemCatJson[k].nodeType, Level: level, Host: this.allRemCatJson[k].host, index: k, alreadyLoaded: alreadyLoaded}
			}
			];
		}
		else{
			this.data = this.data.concat(data2);
			
		}
		
		//costrutisco la tabella
		this.dataSource = this.dataSourceBuilder.create(this.data);
		
		}
	})
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
  iconColumn = 'Actions';
  defaultColumns = [ 'Name', 'Country', 'Type', 'Level', 'Host', 'Actions'];
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

  addRemoteCatalogue(index: number){
	
	var fd = new FormData();   
	fd.append("dump",'');
	// remove attribute image.imageId from json
	let object = this.allRemCatJson[index];
	delete object.image.imageId;
	object.isActive = false;
	fd.append("node",JSON.stringify(object));
	this.restApi.addODMSNode(fd).subscribe(infos =>{
		console.log("\nCHIAMATA API AGGIUNTA NODO. infos: "+infos);
		this.router.navigate(['/pages/administration/adminCatalogues']);
	},err=>{
	console.log(err);
	})
  }

  getShowOn(index: number) {
    const minWithForMultipleColumns = 400;
    const nextColumnStep = 100;
    return minWithForMultipleColumns + (nextColumnStep * index);
  }
  //-------------------------------------------------------------

}
