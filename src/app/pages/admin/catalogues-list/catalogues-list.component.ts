import { Component, OnInit } from '@angular/core';
import { NbSortDirection, NbSortRequest, NbTreeGridDataSource, NbTreeGridDataSourceBuilder } from '@nebular/theme';
import { CataloguesServiceService } from '../catalogues-service.service';
import { ODMSCatalogueInfo } from '../../data-catalogue/model/odmscatalogue-info';
import { ODMSCatalogue } from '../../data-catalogue/model/odmscatalogue';

import { Router } from '@angular/router';
import { Input, Output, EventEmitter} from '@angular/core';
import { FileSaver, saveAs } from 'file-saver';



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
  Status: boolean;
  Datasets: number;
  UpdatePeriod: string;
  LastUpdate: string;
  id: string;
  index: number;
}



@Component({
  selector: 'ngx-catalogues-list',
  templateUrl: './catalogues-list.component.html',
  styleUrls: ['./catalogues-list.component.scss']
})


export class CataloguesListComponent implements OnInit {
   cataloguesInfos: Array<ODMSCatalogueInfo>=[]
   loading=false;
   id=0;

	totalCatalogues;

   cataloguesMoreInfos: ODMSCatalogue
   data: TreeNode<FSEntry>[] = [];

   
   message : string = "create";
   @Output() messageEvent  = new EventEmitter<string>();



    constructor(private dataSourceBuilder: NbTreeGridDataSourceBuilder<FSEntry>, private restApi:CataloguesServiceService) {
    
  }


  ngOnInit(): void {
    this.loading=true

    this.restApi.getCataloguesInfo().subscribe(infos =>{
    console.log("PRIMA API");
	
      this.cataloguesInfos = infos;
      this.totalCatalogues = this.cataloguesInfos.length;
      for (let i = 0; i < this.cataloguesInfos.length; i++) {

			  this.id=this.cataloguesInfos[i].id;
		
		      console.log("NUM CATALOGHI: "+this.cataloguesInfos[i].name);
			  console.log("ID CAT: "+this.id);
				this.loadingMqa.push({id: this.id, loading: false});
		      //this.searchRequest.nodes = infos.map(x=>x.id)
		      //this.searchDataset(true)    
		
		   
		      this.restApi.getCatalogue(this.id).subscribe(infos2 =>{
			  console.log("\nSECONDA API, ID: "+this.id);
		
		      this.cataloguesMoreInfos = infos2;

			  console.log("Name: "+infos2.name+" Country: "+infos2.country+" T: "+infos2.nodeType+" Lev: "+infos2.name+" Stat: "+infos2.name+" Datas: "+infos2.datasetCount+" Name: "+infos2.name+" LastUps: "+infos2.lastUpdateDate);

			 // this.loading=false
		      //this.searchDataset(true)    

//let nameHost = "<a href=\""+infos2.host+"\\\">"+infos2.name+"<a/>";

let level = this.getLevel(infos2.nodeType);



let data2 = [
	    {
      data: { Name: infos2.name, Country: infos2.country, Type: infos2.nodeType, Level: level, Status: infos2.isActive, Datasets: infos2.datasetCount, UpdatePeriod: '1 week', LastUpdate: infos2.lastUpdateDate, id: infos2.id, index: i},
    }
  ];

if(this.data.length==0){
	
	this.data = [
	    {
      data: { Name: infos2.name, Country: infos2.country, Type: infos2.nodeType, Level: level, Status: infos2.isActive, Datasets: infos2.datasetCount, UpdatePeriod: '1 week', LastUpdate: infos2.lastUpdateDate, id: infos2.id, index: i},
    }
  ];
}
else{
	this.data = this.data.concat(data2);
	
}

//costrutisco la tabella
this.dataSource = this.dataSourceBuilder.create(this.data);


		    },err=>{
		      console.log(err);
		     // this.loading=false;
		    })
 
  this.loading=false



    } // fine FOR

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
  customColumn = 'Active';
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
	
   downloadZip = false;
   downloadDump(name, id){
		console.log("\nName: "+name+" id: "+id);
		var download_url = "/Idra/api/v1/administration/dcat-ap/dump/download";
		var filename = "Federated Catalogues Dump";
		if(name!=undefined){
			download_url+="/"+id.toString()+"?zip="+this.downloadZip;
			filename = name+" Dump";
		}else{
			download_url+="?zip="+this.downloadZip;
		}
		console.log("download URL "+download_url);
		this.restApi.getDump(download_url);
		// saveAs(infos3, filename+".rdf");

/*
		$http(req).then(function(value){
						
			var data = value.data;
	        FileSaver.saveAs(data, filename+($scope.downloadZip?".zip":".rdf"));
	        
		}, function(value){
			if(value.status==401){
				$rootScope.token=undefined;
			}
			console.log("ERROR");
		});
*/	
		
		
	};
  //-------------------------------------------------------------
  
  loadingMqa = [];
  async sendMqaAnalisysCatalogue(id : String) : Promise<void>{
	let index = -1;
	for(let i = 0; i < this.loadingMqa.length; i++){
		if(this.loadingMqa[i].id == id){
			this.loadingMqa[i].loading = true;
			index = i;
		}
	}
	
    await this.restApi.submitAnalisysJSON(id)
	.then((res) => {
		if(index != -1){
			this.loadingMqa[index] = false;
		}
		console.log("res:",res)
	})
  }
}
