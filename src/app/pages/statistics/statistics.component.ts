import { Component, OnInit } from '@angular/core';
import * as echarts from 'echarts';
import { CoolTheme } from './cool-theme';
import { StatisticsService } from './statistics.service';
import { RefreshService } from '../services/refresh.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ngx-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss']
})
export class StatisticsComponent implements OnInit {

  constructor(
    private statisticsService : StatisticsService,
    public translation: TranslateService,
        private refreshService: RefreshService,
  ) { }

  options: echarts.EChartsOption = {
    legend: {},
    tooltip: {},
    // Declare an x-axis (category axis).
    // The category map the first column in the dataset by default.
    xAxis: { type: 'category' },	
    // Declare a y-axis (value axis).
    yAxis: {  },
    // Declare several 'bar' series,
    // every series will auto-map to each column by default.
    series: [{ type: 'bar' }],
  };

  optionsMostActive: echarts.EChartsOption = {
    legend: {},
    tooltip: {},
    // Declare an x-axis (category axis).
    // The category map the first column in the dataset by default.
    xAxis: { type: 'category' },	
    // Declare a y-axis (value axis).
    yAxis: {  },
    // Declare several 'bar' series,
    // every series will auto-map to each column by default.
    series: [{ type: 'bar' }, { type: 'bar' }],
  };

  
  optionsCircle: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b} : {c} ({d}%)',
    },
    legend: {
      align: 'auto',
      bottom: 10,
    },
    calculable: true,
    series: [
      {
        name: 'area',
        type: 'pie',
        radius: [30, 110],
        roseType: 'area',
      },
    ],
  };

  dataMostActive: echarts.EChartsOption;
  dataTop10: echarts.EChartsOption;
  dataTechnologies: echarts.EChartsOption;
  dataThemes: echarts.EChartsOption;
  dataFormats: echarts.EChartsOption;
  dataLicenses: echarts.EChartsOption;
  coolTheme = CoolTheme;

  catalogueList: Array<any> = [];
  selectedCatalogues: Array<number> = [0];
  dateInterval: any = [new Date(), new Date(new Date().getTime() - 8*24*60*60*1000)];
  selectedInterval: number = 0;

  getStatistics(): void {
    if(this.selectedInterval == 0){
      this.dateInterval = [new Date(), new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 7)];
    } else if(this.selectedInterval == 1){
      this.dateInterval = [new Date(), new Date(new Date().getFullYear(), new Date().getMonth() -1, new Date().getDate())];
    } else if(this.selectedInterval == 2){
      this.dateInterval = [new Date(), new Date(new Date().getFullYear() - 1, new Date().getMonth(), new Date().getDate())];
    }

    let startDate = this.dateInterval[1].toISOString();
    let endDate = this.dateInterval[0].toISOString();

    let slcCatalogues = [];
    if(this.selectedCatalogues.includes(0)){
      this.catalogueList.forEach((element, index) => {
        slcCatalogues.push(element.id);
      });
    }
    
    this.statisticsService.getStatistics(startDate, endDate, slcCatalogues ).then((data)=>{
      
      let dataTop10 = { dataset: { source: [['Datasets', 'Datasets'] ] } };
      (data.cataloguesStatistics.datasetCountStatistics).forEach((element, index) => {
        dataTop10.dataset.source.push([element.name, element.datasetCount]);
      });
      this.dataTop10 = dataTop10;

      let dataMostActive = {dataset: {source: [['Datasets', 'New Datasets', 'Updated Datasets'] ] } };
      (data.cataloguesStatistics.datasetUpdatedStat).forEach((element, index) => {
        dataMostActive.dataset.source.push([element.name, element.added, element.updated]);
      });
      this.dataMostActive = dataMostActive;

      let dataTechnologies = { dataset: { source: [ ['Technologies', 'Technologies'] ] } };
      (data.cataloguesStatistics.technologiesStat).forEach((element, index) => {
        dataTechnologies.dataset.source.push([element.type, element.count]);
      });
      this.dataTechnologies = dataTechnologies;

      let dataThemes = { dataset: { source: [ ['Themes', 'Themes'] ] } };
      (data.facetsStatistics.themesStatistics).forEach((element, index) => {
        dataThemes.dataset.source.push([element.theme, element.cnt]);
      });
      this.dataThemes = dataThemes;

      let dataFormats = { dataset: { source: [ ['Formats', 'Formats'] ] } };
      (data.facetsStatistics.formatsStatistics).forEach((element, index) => {
        dataFormats.dataset.source.push([element.format, element.cnt]);
      });
      this.dataFormats = dataFormats;

      let dataLicenses = { dataset: { source: [ ['Licenses', 'Licenses'] ] } };
      (data.facetsStatistics.licensesStatistics).forEach((element, index) => {
        dataLicenses.dataset.source.push([element.license, element.cnt]);
      });
      this.dataLicenses = dataLicenses;

    });
  }

  ngOnInit(): void {
    this.refreshService.refreshPageOnce('admin-configuration');
    this.refreshService.refreshPageOnce('admin-configuration');

    this.statisticsService.getCatalogueList().then((data)=>{
      this.catalogueList = data;
      this.getStatistics();
    });
  }

}
