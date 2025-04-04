// datasets-ngsi.component.ts
import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NgsiDatasetsService } from '../services/ngsi-datasets.service';
import { NbDialogService, NbToastrService } from '@nebular/theme';
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog.component';


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
  // Store the datasets to be deleted
  datasetsToDelete: any[] = [];
  totalDatasets: number = 0;
  pageSize = 3;
  currentPage = 1;
  loading = false;
  allItemsLoaded = false;

  constructor(
    public translation: TranslateService,
    private ngsiDatasetsService: NgsiDatasetsService,
    private dialogService: NbDialogService,
    private toastrService: NbToastrService
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

  dynamicUrl(): string {
    return 1 > 0 ? "/pages/datasets-ngsi/editor" : "/pages/datasets-ngsi/editor";
  }

  toggle(datasetId: string): void {
    const index = this.datasetsToDelete.indexOf(datasetId);
    if (index > -1) {
      this.datasetsToDelete.splice(index, 1);
    } else {
      this.datasetsToDelete.push(datasetId);
    }
  }

  isChecked(datasetId: string): boolean {
    return this.datasetsToDelete.includes(datasetId);
  }

  // Delete a single dataset
  deleteDataset(datasetId: string): void {
    this.dialogService.open(ConfirmationDialogComponent, {
      context: {
        title: 'Delete Dataset',
        message: 'Are you sure you want to delete this dataset?',
      },
    }).onClose.subscribe(confirmed => {
      if (confirmed) {
        this.ngsiDatasetsService.deleteDataset(datasetId).subscribe({
          next: () => {
            this.ngsiDatasetsInfo = this.ngsiDatasetsInfo.filter(ds => ds.id !== datasetId);
            this.displayedDatasets = this.displayedDatasets.filter(ds => ds.id !== datasetId);
            
            const index = this.datasetsToDelete.indexOf(datasetId);
            if (index > -1) {
              this.datasetsToDelete.splice(index, 1);
            }
            
            this.toastrService.success('Dataset deleted successfully', 'Success');
          },
          error: (error) => {
            console.error('Error deleting dataset:', error);
            this.toastrService.danger('Failed to delete dataset', 'Error');
          }
        });
      }
    });
  }

  // Delete all selected datasets
  deleteSelectedDatasets(): void {
    if (this.datasetsToDelete.length === 0) {
      this.toastrService.warning('No datasets selected for deletion', 'Warning');
      return;
    }

    this.dialogService.open(ConfirmationDialogComponent, {
      context: {
        title: 'Delete Selected Datasets',
        message: `Are you sure you want to delete ${this.datasetsToDelete.length} selected datasets?`,
      },
    }).onClose.subscribe(confirmed => {
      if (confirmed) {
        // Track completed deletions
        let completedCount = 0;
        let errorCount = 0;
        
        // Process each dataset to delete
        this.datasetsToDelete.forEach(datasetId => {
          this.ngsiDatasetsService.deleteDataset(datasetId).subscribe({
            next: () => {
              completedCount++;
              // Check if all operations completed
              if (completedCount + errorCount === this.datasetsToDelete.length) {
                this.finalizeBatchDeletion(completedCount, errorCount);
              }
            },
            error: (error) => {
              console.error(`Error deleting dataset ${datasetId}:`, error);
              errorCount++;
              // Check if all operations completed
              if (completedCount + errorCount === this.datasetsToDelete.length) {
                this.finalizeBatchDeletion(completedCount, errorCount);
              }
            }
          });
        });
      }
    });
  }

  // Helper to finalize batch deletion and update UI
  private finalizeBatchDeletion(successCount: number, errorCount: number): void {
    // Remove deleted datasets from the displayed lists
    this.ngsiDatasetsInfo = this.ngsiDatasetsInfo.filter(
      ds => !this.datasetsToDelete.includes(ds.id)
    );
    this.displayedDatasets = this.displayedDatasets.filter(
      ds => !this.datasetsToDelete.includes(ds.id)
    );
    
    // Clear the deletion list
    this.datasetsToDelete = [];
    
    // Show appropriate message
    if (errorCount === 0) {
      this.toastrService.success(`Successfully deleted ${successCount} datasets`, 'Success');
    } else if (successCount === 0) {
      this.toastrService.danger(`Failed to delete any datasets`, 'Error');
    } else {
      this.toastrService.warning(`Deleted ${successCount} datasets, but failed to delete ${errorCount}`, 'Partial Success');
    }
  }

  // Edit a dataset - redirect to editor with dataset ID
  editDataset(datasetId: string): void {
    // Navigate to the editor with the dataset ID
    window.location.href = `/pages/datasets-ngsi/editor/${datasetId}`;
  }

  // Function to delete all datasets
  deleteAllDatasets(): void {
    // If no datasets to delete, show warning
    if (this.ngsiDatasetsInfo.length === 0) {
      this.toastrService.warning('No datasets available to delete', 'Warning');
      return;
    }

    // Show confirmation dialog
    this.dialogService.open(ConfirmationDialogComponent, {
      context: {
        title: 'Delete All Datasets',
        message: `Warning: You are about to delete all ${this.ngsiDatasetsInfo.length} datasets. This action cannot be undone. Are you sure you want to proceed?`,
      },
    }).onClose.subscribe(confirmed => {
      if (confirmed) {
        // Track completed deletions
        let completedCount = 0;
        let errorCount = 0;
        const totalCount = this.ngsiDatasetsInfo.length;
        
        // Get all dataset IDs
        const allDatasetIds = this.ngsiDatasetsInfo.map(ds => ds.id);
        
        // Process each dataset to delete
        allDatasetIds.forEach(datasetId => {
          this.ngsiDatasetsService.deleteDataset(datasetId).subscribe({
            next: () => {
              completedCount++;
              // Check if all operations completed
              if (completedCount + errorCount === totalCount) {
                this.finalizeAllDeletion(completedCount, errorCount);
              }
            },
            error: (error) => {
              console.error(`Error deleting dataset ${datasetId}:`, error);
              errorCount++;
              // Check if all operations completed
              if (completedCount + errorCount === totalCount) {
                this.finalizeAllDeletion(completedCount, errorCount);
              }
            }
          });
        });
      }
    });
  }

  // Helper method to finalize all deletion
  private finalizeAllDeletion(successCount: number, errorCount: number): void {
    if (errorCount === 0) {
      // All deletions successful
      this.ngsiDatasetsInfo = [];
      this.displayedDatasets = [];
      this.datasetsToDelete = [];
      this.allItemsLoaded = true;
      
      this.toastrService.success(`Successfully deleted all ${successCount} datasets`, 'Success');
    } else if (successCount === 0) {
      this.toastrService.danger(`Failed to delete any datasets`, 'Error');
    } else {
      // Some deletions failed
      // Reload datasets to get accurate state from server
      this.loadDatasets();
      this.toastrService.warning(`Deleted ${successCount} datasets, but failed to delete ${errorCount}`, 'Partial Success');
    }
  }
}
