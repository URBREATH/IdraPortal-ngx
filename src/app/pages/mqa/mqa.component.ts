import { Component, Input, OnInit, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { MqaService } from '../services/mqa.service';
import { NbSortDirection, NbSortRequest, NbThemeService, NbTreeGridDataSource, NbTreeGridDataSourceBuilder } from '@nebular/theme';
import { delay } from 'rxjs/operators';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import { RefreshService } from '../services/refresh.service';
import * as echarts from 'echarts';
import { TranslateService } from '@ngx-translate/core';

interface TreeNode<T> {
  data: T;
  children?: TreeNode<T>[];
  expanded?: boolean;
}

interface FSEntry {
  Metric: string;
  Value: number;
  Max: string;
  Items?: number;
}
interface FSEntryDataset {
  Metric: string;
  Value: any;
  Items?: number;
}

interface FSEntryListCat {
  Title: string;
  Type: string;
  Date: string;
  Action: string;
}
@Component({
  selector: 'ngx-mqa',
  templateUrl: './mqa.component.html',
  styleUrls: ['./mqa.component.scss']
})
export class MqaComponent implements OnInit {

  @ViewChild('labelImport')
  labelImport: ElementRef;

  formImport: FormGroup;
  fileToUpload: File = null;

  list_ids = [];

  constructor(
    private mqaService : MqaService,
    private theme: NbThemeService,
    private refreshService: RefreshService,
    public translation: TranslateService,
    private dataSourceBuilder: NbTreeGridDataSourceBuilder<FSEntry>, //table catalogue score
    private dataSourceBuilder_dat: NbTreeGridDataSourceBuilder<FSEntryDataset>, //table dataset score
    private dataSourceBuilder_list: NbTreeGridDataSourceBuilder<FSEntryListCat> //table list of catalogues and datasets
  ) { 
    this.dataSource = this.dataSourceBuilder.create(this.data); //table catalogue score
    this.dataSource_dat = this.dataSourceBuilder_dat.create(this.data_dat); //table dataset score
    this.dataSource_list = this.dataSourceBuilder_list.create(this.data_list); //table list of catalogues and datasets
    this.formImport = new FormGroup({
      importFile: new FormControl('', Validators.required)
    });
  }

  file: File | null = null;
  ngOnInit(): void {
    this.refreshService.refreshPageOnce('admin-configuration');
    this.loadList();
  }

  //table catalogue score
  customColumn = 'Metric';
  defaultColumns = [ 'Value', 'Max', 'Items' ];
  allColumns = [ this.customColumn, ...this.defaultColumns ];

  //table dataset score
  customColumn_dat = 'Metric';
  defaultColumns_dat = [ 'Value', 'Items' ];
  allColumns_dat = [ this.customColumn_dat, ...this.defaultColumns_dat ];

  //table list of catalogues and datasets
  customColumn_list = 'Title';
  defaultColumns_list = [ 'Type', 'Date', 'Action' ];
  allColumns_list = [ this.customColumn_list, ...this.defaultColumns_list ];

  dataSource: NbTreeGridDataSource<FSEntry>; //table catalogue score
  dataSource_dat: NbTreeGridDataSource<FSEntryDataset>; //table dataset score
  dataSource_list: NbTreeGridDataSource<FSEntryListCat>; //table list of catalogues and datasets

  sortColumn: string;
  sortDirection: NbSortDirection = NbSortDirection.NONE;

  async loadList(){
    this.data_list = []
    let res = await this.mqaService.getAll();
    res.forEach(element => {
      console.log(element);
      
      // if(element.type == "dataset"){
      //   this.data_list.push(
      //     {
      //       data: { Title: element.title, Type: element.type, Date: element.creation_date, Action: element.id }
      //     })
      // } else {
      //   this.data_list.push(
      //     {
      //       data: { Title: element.title, Type: element.type, Date: element.creation_date, Action: element.id }
      //     })
      // }
      this.data_list.push(
        {
          data: { Title: element.title, Type: element.type, Date: element.creation_date, Action: element.id }
        })
    });
    this.dataSource_list = this.dataSourceBuilder_list.create(this.data_list);
  }


  onFileChange(files: FileList) {
    this.fileToUpload = files.item(0);
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

  public data: TreeNode<FSEntry>[] = []; //table catalogue score
  public data_dat: TreeNode<FSEntryDataset>[] = []; //table dataset score
  private data_list: TreeNode<FSEntryListCat>[] = []; //table list of catalogues and datasets

  getShowOn(index: number) {
    const minWithForMultipleColumns = 400;
    const nextColumnStep = 100;
    return minWithForMultipleColumns + (nextColumnStep * index);
  }

  private value = 0;

  @Input()
  set chartValue(value: number) {
    this.value = value;

    if (this.option.series) {
      this.option.series[0].data[0].value = value;
      this.option.series[0].data[1].value = 100 - value;
      this.option.series[1].data[0].value = value;
    }
  }

  option: any = {};
  themeSubscription: any;

  

  async ngAfterViewInit() {

    this.themeSubscription = this.theme.getJsTheme().pipe(delay(1)).subscribe(config => {

      const solarTheme: any = config.variables.solar;

      this.option = Object.assign({}, {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b} : {c} ({d}%)',
        },
        series: [
          {
            name: ' ',
            clockWise: true,
            hoverAnimation: false,
            type: 'pie',
            center: ['45%', '50%'],
            radius: solarTheme.radius,
            data: [
              {
                value: this.value,
                name: ' ',
                label: {
                  normal: {
                    position: 'center',
                    formatter: '{d}%',
                    textStyle: {
                      fontSize: '22',
                      fontFamily: config.variables.fontSecondary,
                      fontWeight: '600',
                      color: config.variables.fgHeading,
                    },
                  },
                },
                tooltip: {
                  show: false,
                },
                itemStyle: {
                  normal: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                      {
                        offset: 0,
                        color: solarTheme.gradientLeft,
                      },
                      {
                        offset: 1,
                        color: solarTheme.gradientRight,
                      },
                    ]),
                    shadowColor: solarTheme.shadowColor,
                    shadowBlur: 0,
                    shadowOffsetX: 0,
                    shadowOffsetY: 3,
                  },
                },
                hoverAnimation: false,
              },
              {
                value: 100 - this.value,
                name: ' ',
                tooltip: {
                  show: false,
                },
                label: {
                  normal: {
                    position: 'inner',
                  },
                },
                itemStyle: {
                  normal: {
                    color: solarTheme.secondSeriesFill,
                  },
                },
              },
            ],
          },
          {
            name: ' ',
            clockWise: true,
            hoverAnimation: false,
            type: 'pie',
            center: ['45%', '50%'],
            radius: solarTheme.radius,
            data: [
              {
                value: this.value,
                name: ' ',
                label: {
                  normal: {
                    position: 'inner',
                    show: false,
                  },
                },
                tooltip: {
                  show: false,
                },
                itemStyle: {
                  normal: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                      {
                        offset: 0,
                        color: solarTheme.gradientLeft,
                      },
                      {
                        offset: 1,
                        color: solarTheme.gradientRight,
                      },
                    ]),
                    shadowColor: solarTheme.shadowColor,
                    shadowBlur: 7,
                  },
                },
                hoverAnimation: false,
              },
              {
                value: 28,
                name: ' ',
                tooltip: {
                  show: false,
                },
                label: {
                  normal: {
                    position: 'inner',
                  },
                },
                itemStyle: {
                  normal: {
                    color: 'none',
                  },
                },
              },
            ],
          },
        ],
      });
    });
  }

  alertConfirm(data){
    if(confirm("Are you sure you want to delete this element?")){
      this.deleteElement(data);
    }
  }

  ngOnDestroy() {
    this.themeSubscription.unsubscribe();
  }

  async deleteElement(id: string) : Promise<any>{
    await this.mqaService.deleteOne(id)
    this.loadList();
  }

  async getDataset(id: string) : Promise<any>{
    this.data = []
    let response = await this.mqaService.getOne(id);
    console.log(response);
    
    if(response.dataset != null){
      console.log('true');
      let accessUrl = "";
      (response.dataset.accessURL).forEach(element => {
        accessUrl += "code: " + element?.code + "("+element?.percentage+"%), "
      });
      accessUrl = accessUrl.slice(0, -2);

      let downloadURL = "";
      (response.dataset.downloadURLResponseCode).forEach(element => {
        downloadURL += "code: " + element?.code + "("+element?.percentage+"%), "
      });
      downloadURL = downloadURL.slice(0, -2);

      this.data_dat = [
        {
          data: { Metric: 'Findability', Value: "-", Items: 4 },
          children: [
            { data: { Metric: 'keyword', Value: response.dataset.keyword.toString(), Items: 0 } },
            { data: { Metric: 'theme', Value: response.dataset.theme.toString(), Items: 0 } },
            { data: { Metric: 'spatial', Value: response.dataset.spatial.toString(), Items: 0 } },
            { data: { Metric: 'temporal', Value: response.dataset.temporal.toString(), Items: 0 } },
          ],
        },
        {
          data: { Metric: 'Accessibility', Value: "-", Items: 3 },
          children: [
            { data: { Metric: 'AccessURL accessibility', Value: accessUrl.toString(), Items: 0 } },
            { data: { Metric: 'DownloadURL', Value: downloadURL.toString(), Items: 0 } },
            { data: { Metric: 'DownloadURL accessibility', Value: response.dataset.downloadURL.toString(), Items: 0 } },
          ],
        },
        {
          data: { Metric: 'Interoperability', Value: "-", Items: 6 },
          children: [
            { data: { Metric: 'Format', Value: response.dataset.format.toString(), Items: 0 } },
            { data: { Metric: 'Media type', Value: response.dataset.mediaType.toString(), Items: 0 } },
            { data: { Metric: 'Format / Media type from vocabulary', Value: response.dataset.dctFormat_dcatMediaType.toString(), Items: 0 } },
            { data: { Metric: 'Non-proprietary', Value: response.dataset.formatNonProprietary.toString(), Items: 0 } },
            { data: { Metric: 'Machine readable', Value: response.dataset.formatMachineReadable.toString(), Items: 0 } },
            { data: { Metric: 'DCAT-AP compliance', Value: response.dataset.shacl_validation.toString(), Items: 0 } },
          ],
        },
        {
          data: { Metric: 'Reusability', Value: "-", Items: 6 },
          children: [
            { data: { Metric: 'License information', Value: response.dataset.license.toString(), Items: 0 } },
            { data: { Metric: 'License vocabulary', Value: response.dataset.licenseVocabulary.toString(), Items: 0 } },
            { data: { Metric: 'Access restrictions', Value: response.dataset.accessRights.toString(), Items: 0 } },
            { data: { Metric: 'Access restrictions vocabulary', Value: response.dataset.accessRightsVocabulary.toString(), Items: 0 } },
            { data: { Metric: 'Contact point', Value: response.dataset.contactPoint.toString(), Items: 0 } },
            { data: { Metric: 'Publisher', Value: response.dataset.publisher.toString(), Items: 0 } },
          ],
        },
        {
          data: { Metric: 'Contextuality', Value: "-", Items: 4 },
          children: [
            { data: { Metric: 'Rights', Value: response.dataset.rights.toString(), Items: 0 } },
            { data: { Metric: 'File size', Value: response.dataset.byteSize.toString(), Items: 0 } },
            { data: { Metric: 'Date of issue', Value: response.dataset.issued.toString(), Items: 0 } },
            { data: { Metric: 'Modification date', Value: response.dataset.modified.toString(), Items: 0 } },
          ],
        },
      ]

      this.dataSource_dat = this.dataSourceBuilder_dat.create(this.data_dat);
    } else {
      this.data_dat = []
      this.dataSource_dat = this.dataSourceBuilder_dat.create(this.data_dat);
    }
    console.log(this.data_dat);
  }

  async getCatalogue(id: string) : Promise<any>{
    this.data_dat = []
    let response = await this.mqaService.getOne(id);
    if(response.catalogue != null){
      this.data = [
        {
          data: { Metric: 'Findability', Value: response.catalogue.score.findability, Max: '100', Items: 4 },
          children: [
            { data: { Metric: 'keyword', Value: response.catalogue.score.keyword_Weight, Max: '30', Items: 0 } },
            { data: { Metric: 'theme', Value: response.catalogue.score.theme_Weight, Max: '30', Items: 0 } },
            { data: { Metric: 'spatial', Value: response.catalogue.score.spatial_Weight, Max: '20', Items: 0 } },
            { data: { Metric: 'temporal', Value: response.catalogue.score.temporal_Weight, Max: '20', Items: 0 } },
          ],
        },
        {
          data: { Metric: 'Accessibility', Value: response.catalogue.score.accessibility, Items: 3, Max: '100' },
          children: [
            { data: { Metric: 'AccessURL accessibility', Value: response.catalogue.score.accessURL_Weight, Max: '50', Items: 0 } },
            { data: { Metric: 'DownloadURL', Value: response.catalogue.score.downloadURLResponseCode_Weight, Max: '20', Items: 0 } },
            { data: { Metric: 'DownloadURL accessibility', Value: response.catalogue.score.downloadURL_Weight, Max: '20', Items: 0 } },
          ],
        },
        {
          data: { Metric: 'Interoperability', Value: response.catalogue.score.interoperability, Items: 6, Max: '110' },
          children: [
            { data: { Metric: 'Format', Value: response.catalogue.score.format_Weight, Max: '20', Items: 0 } },
            { data: { Metric: 'Media type', Value: response.catalogue.score.mediaType_Weight, Max: '10', Items: 0 } },
            { data: { Metric: 'Format / Media type from vocabulary', Value: response.catalogue.score.dctFormat_dcatMediaType_Weight, Max: '10', Items: 0 } },
            { data: { Metric: 'Non-proprietary', Value: response.catalogue.score.formatNonProprietary_Weight, Max: '20', Items: 0 } },
            { data: { Metric: 'Machine readable', Value: response.catalogue.score.formatMachineReadable_Weight, Max: '20', Items: 0 } },
            { data: { Metric: 'DCAT-AP compliance', Value: response.catalogue.score.shacl_validation_Weight, Max: '30', Items: 0 } },
          ],
        },
        {
          data: { Metric: 'Reusability', Value: response.catalogue.score.reusability, Items: 6, Max: '75' },
          children: [
            { data: { Metric: 'License information', Value: response.catalogue.score.license_Weight, Max: '20', Items: 0 } },
            { data: { Metric: 'License vocabulary', Value: response.catalogue.score.licenseVocabulary_Weight, Max: '10', Items: 0 } },
            { data: { Metric: 'Access restrictions', Value: response.catalogue.score.accessRights_Weight, Max: '10', Items: 0 } },
            { data: { Metric: 'Access restrictions vocabulary', Value: response.catalogue.score.accessRightsVocabulary_Weight, Max: '5', Items: 0 } },
            { data: { Metric: 'Contact point', Value: response.catalogue.score.contactPoint_Weight, Max: '20', Items: 0 } },
            { data: { Metric: 'Publisher', Value: response.catalogue.score.publisher_Weight, Max: '10', Items: 0 } },
          ],
        },
        {
          data: { Metric: 'Contextuality', Value: response.catalogue.score.contextuality, Items: 4, Max: '20' },
          children: [
            { data: { Metric: 'Rights', Value: response.catalogue.score.rights_Weight, Max: '5', Items: 0 } },
            { data: { Metric: 'File size', Value: response.catalogue.score.byteSize_Weight, Max: '5', Items: 0 } },
            { data: { Metric: 'Date of issue', Value: response.catalogue.score.issued_Weight, Max: '5', Items: 0 } },
            { data: { Metric: 'Modification date', Value: response.catalogue.score.modified_Weight, Max: '5', Items: 0 } },
          ],
        },
      ]

      this.dataSource = this.dataSourceBuilder.create(this.data);
      this.value = Math.floor((response.catalogue.score.overall/405) * 100);
      //update chart value
      this.ngAfterViewInit();
      document.getElementById("overall").innerHTML = response.catalogue.score.overall;
      // document.getElementById("response-type").innerHTML = "catalogue";
    } else {
      this.data = []
      this.dataSource = this.dataSourceBuilder.create(this.data);
      this.value = 0;
      //update chart value
      this.ngAfterViewInit();
      document.getElementById("overall").innerHTML = "0";
      // document.getElementById("response-type").innerHTML = "dataset";
    }
  }

  async submitAnalisysJSON(xml : String) : Promise<any>{
    if(xml == ""){
      return alert("Please insert an url");
    }
    //xml will be added to the body of the request from a local json file because it is too long to be added here
    await this.mqaService.submitAnalisysJSON(xml)
    this.loadList();
  }
  async submitAnalisysFile() : Promise<any>{
    if(this.fileToUpload == null){
      return alert("Please insert a file");
    }
    await this.mqaService.submitAnalisysFile(this.fileToUpload)
    this.loadList();
  }

  onFileSelected(event: any): void{
    
    const selectedFile: File = event.target.files[0];

    if (selectedFile) 
      this.file = selectedFile;
  }


}

@Component({
  selector: 'ngx-fs-icon',
  template: `
    <nb-tree-grid-row-toggle [expanded]="expanded" *ngIf="this.Items != 0; else fileIcon">
    </nb-tree-grid-row-toggle>
    <ng-template #fileIcon>
      <nb-icon icon="file-text-outline"></nb-icon>
    </ng-template>
  `,
})
export class FsIconComponent {
  @Input() Items: number;
  @Input() expanded: boolean;

}

@Component({
  selector: 'ngx-fs-icon-cat',
  template: `
    <nb-tree-grid-row-toggle [expanded]="expanded" *ngIf="this.type != null || this.type != undefined; else fileIcon">
    </nb-tree-grid-row-toggle>
    <ng-template #fileIcon>
      <nb-icon icon="file-text-outline"></nb-icon>
    </ng-template>
  `,
})
export class FsIconComponentCat {
  @Input() type: string;
  @Input() expanded: boolean;

}
