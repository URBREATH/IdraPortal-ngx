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

  // Store all fetched data here
  ngsiDatasetsInfo: any[] = [];
  // Store the data to be displayed
  displayedDatasets: any[] = [];
  totalDatasets: number = 0;
  pageSize = 3;
  currentPage = 1;
  loading = false;
  allItemsLoaded = false;

  constructor(
    public translation: TranslateService,
    private ngsiDatasetsService: NgsiDatasetsService
  ) { }

  ngOnInit(): void {
    // Call the method in your service
    this.loadDatasets();
  }

  loadDatasets(): void {
    this.loading = true;
    // Subscribe to the Observable from your service
    this.ngsiDatasetsService.getDatasets().subscribe({
      next: (response) => {
        console.log('Response from server:', response);
        // Save the fetched data into a component property
        this.ngsiDatasetsInfo = response;
        // Initialize displayed datasets with first page
        this.displayedDatasets = this.ngsiDatasetsInfo.slice(0, this.pageSize);
        // Example: if the response is an array, you can count it
        this.totalDatasets = this.ngsiDatasetsInfo.length;
        this.loading = false;
        
        // Check if all items are already loaded (if data is less than page size)
        if (this.displayedDatasets.length >= this.ngsiDatasetsInfo.length) {
          this.allItemsLoaded = true;
        }
      },
      error: (error) => {
        console.error('Error in GET request:', error);
        this.loading = false;
      }
    });
  }

  loadMoreDatasets(): void {
    // If already loading or all items are loaded, don't do anything
    if (this.loading || this.allItemsLoaded) {
      return;
    }
    
    this.loading = true;
    
    // Calculate the next batch of items to display
    const nextBatch = this.ngsiDatasetsInfo.slice(
      this.displayedDatasets.length, 
      this.displayedDatasets.length + this.pageSize
    );
    
    // Simulate network delay for smoother UX
    setTimeout(() => {
      // Add the next batch to displayed datasets
      this.displayedDatasets.push(...nextBatch);
      
      // Check if we've loaded all available items
      if (this.displayedDatasets.length >= this.ngsiDatasetsInfo.length) {
        this.allItemsLoaded = true;
      }
      
      this.loading = false;
    }, 500);
  }
}
