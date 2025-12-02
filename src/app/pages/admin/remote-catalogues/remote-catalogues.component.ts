import { Component, OnInit } from '@angular/core';
import { NbSortDirection, NbSortRequest, NbTreeGridDataSource, NbTreeGridDataSourceBuilder,NbToastrService } from '@nebular/theme';
import { CataloguesServiceService } from '../catalogues-service.service';
import { ODMSCatalogueInfo } from '../../data-catalogue/model/odmscatalogue-info';
import { ODMSCatalogue } from '../../data-catalogue/model/odmscatalogue';

import * as remoteCatalogueData from '../../../../assets/remoteCatalogues.json';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { RefreshService } from '../../services/refresh.service';


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
   allCatalogues = [];
   alreadyLoaded = false;
   dataIsIdra: any
   dataNotIdra: any
   selectedCatalogueIsIdra : boolean

  constructor(private dataSourceBuilder: NbTreeGridDataSourceBuilder<FSEntry>, 
	private refreshService: RefreshService,
	private restApi:CataloguesServiceService, 
	private router: Router,
	public translation: TranslateService,
	private toastrService: NbToastrService) { }

  ngOnInit(): void {

    this.refreshService.refreshPageOnce('admin-configuration');

	// GET REM CATALOGUES LIST
	this.restApi.getAllRemCat().subscribe(infos =>{
		console.log('Remote Catalogues:', infos);
				console.log("\nCHIAMATA API GET ALL REM CAT. infos: "+infos[0].URL);
				this.allRemCat = infos;
	
	},err=>{
      console.log(err);
    })
	this.allRemCatJson = this.allRemCatJson.default
	// console.log("\nREM CAT 1: "+this.allRemCatJson[0].name);

	//let allCatalogues = [];
	this.restApi.getAllCataloguesInfo().subscribe(infos =>{
		console.log('Catalogues infos:', infos);
		this.allCatalogues = infos;
		for (let k = 0; k < this.allRemCatJson.length; k++) {
				
		// console.log("\nLOCATION: "+this.allRemCatJson[k].host);
		//let nameHost = "<a href=\""+infos2.host+"\\\">"+infos2.name+"<a/>";
		
		let level = this.getLevel(this.allRemCatJson[k].nodeType);
		
		let  alreadyLoaded = false;
		for (let i = 0; i < this.allCatalogues.length; i++) {
			if(this.allCatalogues[i].host == this.allRemCatJson[k].host){
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

	this.dataNotIdra = this.allRemCatJson;
	this.selectedCatalogueIsIdra = false;
  }

    // Handle catalogue selection
	onCatalogueChange(selectedId: number): void {

		 console.log("Selected Catalogue ID: ", selectedId);

		  // Find the selected catalogue object
		  let selectedCatalogue = this.allRemCat.find(cat => cat.id === selectedId);
		  if (!selectedCatalogue) {
			console.warn("Catalogue not found!");
			return;
		  }
		  console.log("Selected Catalogue: ", selectedCatalogue);

		  this.selectedCatalogueIsIdra = selectedCatalogue.isIdra;
		  console.log("Selected Catalogue Idra(true) or not(false): ", this.selectedCatalogueIsIdra);
		  let selectedCatalogueURL = selectedCatalogue.URL;
		  console.log("Selected Catalogue URL: ", selectedCatalogueURL);
		  let selectedCatalogueUsername = selectedCatalogue.username;
		  console.log("Selected Catalogue Username: ", selectedCatalogueUsername);
		  let selectedCatalogueIsAuth = (selectedCatalogueUsername != null) ? true : false;
		  console.log("Selected Catalogue Authenticated: ", selectedCatalogueIsAuth);
		  //let selectedCatalogueClientID = selectedCatalogue.clientID;	  
		  //console.log("Selected Catalogue Client ID: ", selectedCatalogueClientID);

		  //&& (selectedCatalogueClientID==null)
		  //IDRA catalogue
		if(this.selectedCatalogueIsIdra && selectedCatalogueIsAuth){
			this.loadAuthenticatedIdraCatalogue(selectedId);
		}
		//NOT Idra Catalogue
		else if(!this.selectedCatalogueIsIdra && !selectedCatalogueIsAuth){
			this.loadJsonCatalogue(selectedCatalogueURL);
		}
}

// Load authenticated IDRA catalogue
loadAuthenticatedIdraCatalogue(selectedId: number): void {
    console.log("Loading authenticated IDRA catalogue...");

    this.restApi.getSelectedRemCat(selectedId).subscribe(
        data => {
            console.log("Catalogue Data:", data);
			this.dataIsIdra = data;
            this.updateDataSource(data);
        },
        err => {
            console.error("Error fetching IDRA catalogue data:", err);
            this.clearDataSource();
        }
    );
}

// Load JSON-based catalogue
loadJsonCatalogue(url: string): void {
    console.log("Loading JSON catalogue...");

    this.restApi.getSelectedRemCatNotIdra(url).then(
        data => {
            console.log("Catalogue Data:", data);
			this.dataNotIdra = data;
            this.updateDataSource(data);
        },
        err => {
            console.error("Error fetching JSON catalogue data:", err);
            this.clearDataSource();
        }
    );
}

// Update the table data source
private updateDataSource(data: any[]): void {
    if (!Array.isArray(data)) {
        console.error("Invalid catalogue data format:", data);
        this.clearDataSource();
        return;
    }

    this.data = data.map((item, index) => ({
        data: {
            Name: item.name,
            Country: item.country || '',
            Type: item.nodeType,
            Level: this.getLevel(item.nodeType),
            Host: item.host || '',
            index,
            alreadyLoaded: this.allCatalogues.some(cat => cat.host === item.host)
        }
    }));

    this.dataSource = this.dataSourceBuilder.create(this.data);
}

// Clear table data source on error
private clearDataSource(): void {
    this.data = [];
    this.dataSource = this.dataSourceBuilder.create([]);
}

getLevel(nodeType: string): string {
		switch(nodeType){
			case 'CKAN':
			case 'ZENODO':
				//federationLevel='LEVEL_3';
				return "3";
			case 'DKAN':
			case 'SOCRATA':
			case 'SPOD':
			case 'WEB':
			case 'OPENDATASOFT':
			case 'JUNAR':	
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
			case 'SPARQL':
				//node.federationLevel='LEVEL_4';
				return "4";
			case 'GEONETWORK_ISO19139':
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

	console.log("Row index: "+index);
	console.log("Selected catalogue Idra or not: "+this.selectedCatalogueIsIdra);

	let object = this.selectedCatalogueIsIdra == true ? this.dataIsIdra[index] : this.dataNotIdra[index];
	console.log("Object data: "+JSON.stringify(object));
 
	if (confirm("Add this remote catalogue to your local instance?")) {

		//let object = this.allRemCatJson[index];
		// remove attribute image.imageId from json
		if (object.image?.imageId)  delete object.image.imageId; 
		//object.isActive = false;
		if ('id' in object) delete object.id;
		if ('isActive' in object) delete object.isActive;
		if (object.sitemap?.id) delete object.sitemap.id;
		if (object.sitemap?.navigationParameter?.id) delete object.sitemap.navigationParameter.id;
		if ('homepage' in object) object.homepage=object.host;
		if ('datasetStart' in object) object.datasetStart=0;
		//object.alreadyLoaded = true; //check

		console.log("Object data after deleting several properties: "+JSON.stringify(object));

		var fd = new FormData();   
		fd.append("node",JSON.stringify(object));
		fd.append("dump",'');

		this.restApi.addODMSNode(fd).subscribe(infos =>{
			console.log("\nCHIAMATA API AGGIUNTA NODO. infos: "+infos);
			this.router.navigate(['/pages/administration/adminCatalogues'], 
			{
			queryParamsHandling: 'merge',
			});
		},err=>{
			this.toastrService.danger('Could not create catalogue: '+err.error.userMessage,'Error');
			console.error(err.error.technicalMessage);
		})
	}
  }

  getShowOn(index: number) {
    const minWithForMultipleColumns = 400;
    const nextColumnStep = 100;
    return minWithForMultipleColumns + (nextColumnStep * index);
  }
  //-------------------------------------------------------------

}
