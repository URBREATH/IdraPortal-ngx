// datasets-ngsi.component.ts
import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NgsiDatasetsService } from '../services/ngsi-datasets.service';

@Component({
  selector: 'ngx-datasets-ngsi',
  templateUrl: './datasets-ngsi.component.html',
  styleUrls: ['./datasets-ngsi.component.scss']
})
export class DatasetsNgsiComponent implements OnInit {

  // Store your fetched data here
  ngsiDatasetsInfo: any[] = [];
  totalDatasets: number = 0;

  constructor(
    public translation: TranslateService,
    // Inject the service here
    private ngsiDatasetsService: NgsiDatasetsService
  ) { }

  ngOnInit(): void {
    // Call the method in your service
    this.loadDatasets();
  }

  loadDatasets(): void {
    // Subscribe to the Observable from your service
    this.ngsiDatasetsService.getDatasets().subscribe({
      next: (response) => {
        console.log('Response from server:', response);
        // Save the fetched data into a component property
        this.ngsiDatasetsInfo = response;
        // Example: if the response is an array, you can count it
        this.totalDatasets = this.ngsiDatasetsInfo.length;
      },
      error: (error) => {
        console.error('Error in GET request:', error);
      }
    });
  }
}
