// datasets-ngsi.component.ts
import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NgsiDatasetsService } from '../services/ngsi-datasets.service';
import { NbDialogService, NbTagComponent, NbTagInputAddEvent, NbToastrService } from '@nebular/theme';
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog.component';
import { Router } from '@angular/router';

@Component({
  selector: 'ngx-datasets-ngsi',
  templateUrl: './datasets-ngsi.component.html',
  styleUrls: ['./datasets-ngsi.component.scss']
})
export class DatasetsNgsiComponent implements OnInit {

  // Store all fetched data here
  ngsiDatasetsInfo: any[] = [];
  // Store the data to be displayed after filtering
  filteredDatasets: any[] = [];
  // Store the displayed datasets (paginated)
  displayedDatasets: any[] = [];
  // Store the datasets to be deleted
  datasetsToDelete: any[] = [];
  totalDatasets: number = 0;
  currentDatasets: number = 0;
  
  // Pagination settings
  pageSize = 10;
  currentPage = 1;
  loading = false;
  
  // Filter tags
  filters: Array<string> = [];
  filtersTags: Array<string> = [];
  
  searchResponse: any = {
    results: [],
    facets: [],
    count: 0
  };
  
  // For facet limits
  facetLimits: {[key: string]: number} = {};

  constructor(
    private router: Router,
    public translation: TranslateService,
    private ngsiDatasetsService: NgsiDatasetsService,
    private dialogService: NbDialogService,
    private toastrService: NbToastrService
  ) { }

  ngOnInit(): void {
    //clear localStorage to avoid conflicts with other components
    localStorage.removeItem('dataset_to_edit');

    // Call the method in your service
    this.loadDatasets();
  }

  loadDatasets(): void {
    this.loading = true;
    // Subscribe to the Observable from your service
    this.ngsiDatasetsService.getDatasets().subscribe({
      next: (response) => {
        // Save the fetched data into a component property
        this.ngsiDatasetsInfo = response;
        this.filteredDatasets = [...this.ngsiDatasetsInfo];
        this.totalDatasets = this.ngsiDatasetsInfo.length;
        this.currentDatasets = this.totalDatasets;
        
        // Update search response for template
        this.searchResponse.results = this.ngsiDatasetsInfo;
        this.searchResponse.count = this.ngsiDatasetsInfo.length;
        
        // Example facets - you would need to generate real facets from your data
        this.searchResponse.facets = this.generateFacets(this.ngsiDatasetsInfo);
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error in GET request:', error);
        this.loading = false;
      }
    });
  }
  
  // Generate facets from datasets
  generateFacets(datasets: any[]): any[] {
    // Example implementation - customize based on your data structure
    const facets = [];
    
    // Example: themes facet
    const themes = new Set<string>();
    datasets.forEach(dataset => {
      if (dataset.theme) {
        if (Array.isArray(dataset.theme)) {
          dataset.theme.forEach(t => themes.add(t));
        } else {
          themes.add(dataset.theme);
        }
      }
    });
    
    if (themes.size > 0) {
      facets.push({
        displayName: 'Themes',
        search_parameter: 'theme',
        values: Array.from(themes).map(theme => ({
          facet: theme,
          search_value: theme
        }))
      });
    }
    
    // Example: keywords facet
    // Add similar code for other facets (keywords, publishers, etc.)

    const keywords = new Set<string>();
    datasets.forEach(dataset => {
      if (dataset.keyword) {
        if (Array.isArray(dataset.keyword)) {
          dataset.keyword.forEach(k => keywords.add(k));
        } else {
          keywords.add(dataset.keyword);
        }
      }
    });

    if (keywords.size > 0) {
      facets.push({
        displayName: 'Keywords',
        search_parameter: 'keyword',
        values: Array.from(keywords).map(keyword => ({
          facet: keyword,
          search_value: keyword
        }))
      });
    }

    const publishers = new Set<string>();
    datasets.forEach(dataset => {
      if (dataset.publisher) {
        if (Array.isArray(dataset.publisher)) {
          dataset.publisher.forEach(p => publishers.add(p));
        } else {
          publishers.add(dataset.publisher);
        }
      }
    });

    if (publishers.size > 0) {
      facets.push({
        displayName: 'Publishers',
        search_parameter: 'publisher',
        values: Array.from(publishers).map(publisher => ({
          facet: publisher,
          search_value: publisher
        }))
      });
    }

    return facets;
  }

  onTagRemove(tagToRemove: NbTagComponent): void {
    this.filters = this.filters.filter(tag => tag !== tagToRemove.text);
    this.currentPage = 1;
    // Apply filters to data
    this.applyFilters();
  }

  onTagAdd({ value, input }: NbTagInputAddEvent): void {
    setTimeout(() => {
      if (input) {
        input.nativeElement.value = '';
      }
      if (value && value.trim() !== '') {
        this.filters.push(value.trim());
        this.currentPage = 1;
        this.applyFilters();
      }
    }, 50);
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

   // Add filter removal method
   onFilterRemove(tagToRemove: NbTagComponent): void {
    this.filtersTags = this.filtersTags.filter(tag => tag !== tagToRemove.text);
    this.currentPage = 1;
    this.applyFilters();
  }

  // Delete a single dataset
  deleteDataset(datasetId: string): void {
    // Find the dataset to get its distributions
    const dataset = this.ngsiDatasetsInfo.find(ds => ds.id === datasetId);
    if (!dataset) {
      this.toastrService.danger(this.translation.instant('DATASET_NOT_FOUND'), this.translation.instant('TOAST_ERROR'));
      return;
    }

    // Ensure datasetDistribution is always an array
    const distributionIds = Array.isArray(dataset.datasetDistribution) 
      ? dataset.datasetDistribution 
      : (dataset.datasetDistribution ? [dataset.datasetDistribution] : []);

    this.dialogService.open(ConfirmationDialogComponent, {
      context: {
        title: 'Delete Dataset',
        message: `Are you sure you want to delete this dataset${distributionIds.length > 0 ? ' and its ' + distributionIds.length + ' associated distributions' : ''}?`,
      },
    }).onClose.subscribe(confirmed => {
      if (confirmed) {
        // If no distributions, just delete the dataset
        if (distributionIds.length === 0) {
          this.performDatasetDeletion(datasetId);
          return;
        }

        // Track distribution deletions
        let deletedCount = 0;
        let errorCount = 0;
        
        // Delete each distribution first
        distributionIds.forEach(distId => {
          // Transform the distribution ID format before sending to API
          const transformedDistId = distId.replace("urn:ngsi-ld:Dataset:items:", "urn:ngsi-ld:DistributionDCAT-AP:id:");
          
          this.ngsiDatasetsService.deleteDistribution(transformedDistId).subscribe({
            next: () => {
              deletedCount++;
              // When all distributions are processed, delete the dataset
              if (deletedCount + errorCount === distributionIds.length) {
                this.performDatasetDeletion(datasetId);
              }
            },
            error: (error) => {
              console.error(`Error deleting distribution ${transformedDistId}:`, error);
              errorCount++;
              if (deletedCount + errorCount === distributionIds.length) {
                if (errorCount > 0) {
                  this.toastrService.warning(
                    `Failed to delete ${errorCount} distributions. Proceeding with dataset deletion.`,
                    'Warning'
                  );
                }
                // Still try to delete the dataset even if some distributions failed
                this.performDatasetDeletion(datasetId);
              }
            }
          });
        });
      }
    });
  }

  // Helper method to delete the dataset and update UI
  private performDatasetDeletion(datasetId: string): void {
    this.ngsiDatasetsService.deleteDataset(datasetId).subscribe({
      next: () => {
        // Remove dataset from all dataset collections
        this.ngsiDatasetsInfo = this.ngsiDatasetsInfo.filter(ds => ds.id !== datasetId);
        this.filteredDatasets = this.filteredDatasets.filter(ds => ds.id !== datasetId);
        
        // Update counts
        this.totalDatasets = this.ngsiDatasetsInfo.length;
        this.currentDatasets = this.filteredDatasets.length;
        
        // Update search response
        this.searchResponse.results = this.filteredDatasets;
        this.searchResponse.count = this.filteredDatasets.length;
        
        // Regenerate facets as they may have changed
        this.searchResponse.facets = this.generateFacets(this.ngsiDatasetsInfo);
        
        // Check if we need to adjust current page
        const totalPages = Math.ceil(this.filteredDatasets.length / this.pageSize);
        if (this.currentPage > totalPages && totalPages > 0) {
          this.currentPage = totalPages;
        }
        
        // Apply pagination
        this.pageChanged(this.currentPage);
        
        // Remove from delete selection if it was there
        const index = this.datasetsToDelete.indexOf(datasetId);
        if (index > -1) {
          this.datasetsToDelete.splice(index, 1);
        }
        
        this.toastrService.success(
          this.translation.instant('TOAST_DATASET_DELETED'),
          this.translation.instant('TOAST_SUCCESS')
        );
      },
      error: (error) => {
        console.error('Error deleting dataset:', error);
        this.toastrService.danger(
          this.translation.instant('TOAST_DATASET_DELETION_FAILED', {errorMessage: error.message || 'Unknown error'}),
          this.translation.instant('TOAST_ERROR')
        );
      }
    });
  }

  // Delete all selected datasets
  deleteSelectedDatasets(): void {
    if (this.datasetsToDelete.length === 0) {
      this.toastrService.warning(
        this.translation.instant('TOAST_NO_DATASETS_SELECTED'),
        this.translation.instant('TOAST_WARNING')
      );
      return;
    }

    // Count how many distributions will be deleted
    let distributionCount = 0;
    this.datasetsToDelete.forEach(datasetId => {
      const dataset = this.ngsiDatasetsInfo.find(ds => ds.id === datasetId);
      if (dataset && dataset.datasetDistribution) {
        if (Array.isArray(dataset.datasetDistribution)) {
          distributionCount += dataset.datasetDistribution.length;
        } else {
          distributionCount += 1; // Single distribution
        }
      }
    });

    this.dialogService.open(ConfirmationDialogComponent, {
      context: {
        title: this.translation.instant('DIALOG_DELETE_SELECTED_DATASETS'),
        message: this.translation.instant('DIALOG_DELETE_SELECTED_DATASETS_MESSAGE', {
          datasetCount: this.datasetsToDelete.length,
          distributionCount: distributionCount
        }),
      },
    }).onClose.subscribe(confirmed => {
      if (confirmed) {
        // Show deletion in progress
        this.toastrService.info(
          this.translation.instant('TOAST_DELETION_IN_PROGRESS'),
          this.translation.instant('TOAST_PLEASE_WAIT')
        );
        
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
    // Clear the deletion list
    this.datasetsToDelete = [];
    
    // Show appropriate message
    if (errorCount === 0) {
      this.toastrService.success(
        this.translation.instant('TOAST_DELETED_DATASETS_SUCCESS', {count: successCount}),
        this.translation.instant('TOAST_SUCCESS')
      );
    } else if (successCount === 0) {
      this.toastrService.danger(
        this.translation.instant('TOAST_DELETE_DATASETS_FAILED'),
        this.translation.instant('TOAST_ERROR')
      );
    } else {
      this.toastrService.warning(
        this.translation.instant('TOAST_DELETE_DATASETS_PARTIAL', {
          successCount: successCount,
          errorCount: errorCount
        }),
        this.translation.instant('TOAST_PARTIAL_SUCCESS')
      );
    }
    
    // Refresh the dataset list
    this.loadDatasets();
  }

  // Edit a dataset
  editDataset(datasetId: string): void {
     // Find the dataset with this ID
     const datasetToEdit = this.ngsiDatasetsInfo.find(dataset => dataset.id === datasetId);
    
    // Ensure datasetDistribution is always an array before storing
    if (datasetToEdit) {
      if (!datasetToEdit.datasetDistribution) {
        datasetToEdit.datasetDistribution = [];
      } else if (!Array.isArray(datasetToEdit.datasetDistribution)) {
        datasetToEdit.datasetDistribution = [datasetToEdit.datasetDistribution];
      }
      
      // Save the dataset to localStorage
      localStorage.setItem('dataset_to_edit', JSON.stringify(datasetToEdit));
      
      // Navigate to the editor page
      this.router.navigate(['/pages/datasets-ngsi/editor'], 
      {
      queryParamsHandling: 'merge',
      });
    }
  }

  // Add page change handler
  pageChanged(pageNumber: number): void {
    this.currentPage = pageNumber;
    // Update displayed datasets based on current page
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedDatasets = this.filteredDatasets.slice(startIndex, endIndex);
    this.searchResponse.results = this.displayedDatasets; // Update search results
  }
    
  // For facet methods
  getFacetsLimit(facet: string): number {
    if(this.facetLimits[facet] === undefined) {
      this.facetLimits[facet] = 10;
    }
    return this.facetLimits[facet];
  }
    
  setFacetsLimit(facet: string, value: number): void {
    this.facetLimits[facet] = value;
  }
    
  // Filter facets based on search parameter
  filterFacets(search_parameter: string, values: any[]): any[] {
    // Example implementation - customize based on your needs
    return values || [];
  }
    
  // Method to filter by facet
  getDatasetByFacet(search_parameter: string, search_value: string): void {
    // Add facet filter tag
    const facetIndex = this.searchResponse.facets.findIndex(
      (x: any) => x.search_parameter === search_parameter
    );
      
    if (facetIndex >= 0) {
      const facet = this.searchResponse.facets[facetIndex];
      const filterTag = `${facet.displayName}: ${search_value}`;
        
      if (!this.filtersTags.includes(filterTag)) {
        this.filtersTags.push(filterTag);
        this.applyFilters();
      }
    }
  }
    
  // Apply filters to datasets
  applyFilters(): void {
    // Reset to all datasets if no filters
    if (this.filters.length === 0 && this.filtersTags.length === 0) {
      this.filteredDatasets = [...this.ngsiDatasetsInfo];
      this.searchResponse.results = this.filteredDatasets;
      this.currentDatasets = this.filteredDatasets.length;
      return;
    }
      
    // Apply text filters from this.filters
    let datasets = this.ngsiDatasetsInfo;
      
    if (this.filters.length > 0) {
      datasets = datasets.filter(dataset => {
        return this.filters.some(filter => {
          const filterLower = filter.toLowerCase();
          return (
            (dataset.title && dataset.title.toLowerCase().includes(filterLower)) || 
            (dataset.description && dataset.description.toLowerCase().includes(filterLower)) ||
            (this.checkArrayContains(dataset.keyword, filterLower))
          );
        });
      });
    }
      
    // Apply facet filters from this.filtersTags
    if (this.filtersTags.length > 0) {
      datasets = datasets.filter(dataset => {
        return this.filtersTags.every(tagFilter => {
          if (!tagFilter.includes(': ')) return true;
            
          const [facetName, facetValue] = tagFilter.split(': ');
            
          // Find the actual field name from facet display name
          let fieldName = facetName.toLowerCase();
          const facet = this.searchResponse.facets.find(
            (f: any) => f.displayName.toLowerCase() === fieldName
          );
            
          if (facet) {
            fieldName = facet.search_parameter;
          }
            
          // Check dataset property based on field name
          return this.checkFieldContains(dataset, fieldName, facetValue);
        });
      });
    }
      
    this.filteredDatasets = datasets;
    this.searchResponse.results = this.filteredDatasets;
    this.currentDatasets = this.filteredDatasets.length;
      
    // Update displayed datasets for pagination
    this.pageChanged(1);
  }

  // Function to delete all datasets
  deleteAllDatasets(): void {
    // If no datasets to delete, show warning
    if (this.ngsiDatasetsInfo.length === 0) {
      this.toastrService.warning(this.translation.instant('NO_DATASETS_TO_DELETE'), this.translation.instant('TOAST_WARNING'));
      return;
    }

    // Raccogli tutti gli ID delle distribuzioni da tutti i dataset
    const allDistributionIds: string[] = [];
    this.ngsiDatasetsInfo.forEach(dataset => {
      if (dataset.datasetDistribution) {
        const distributionIds = Array.isArray(dataset.datasetDistribution)
          ? dataset.datasetDistribution
          : [dataset.datasetDistribution];
        allDistributionIds.push(...distributionIds);
      }
    });

    // Show confirmation dialog
    this.dialogService.open(ConfirmationDialogComponent, {
      context: {
        title: this.translation.instant('DIALOG_DELETE_ALL_DATASETS'),
        message: this.translation.instant('DIALOG_DELETE_ALL_DATASETS_MESSAGE', {
          datasetCount: this.ngsiDatasetsInfo.length,
          distributionCount: allDistributionIds.length
        }),
      },
    }).onClose.subscribe(confirmed => {
      if (confirmed) {
        // Prima elimina tutte le distribuzioni
        if (allDistributionIds.length > 0) {
          this.deleteAllDistributions(allDistributionIds);
        } else {
          // Se non ci sono distribuzioni, procedi direttamente con l'eliminazione dei dataset
          this.deleteAllDatasetsOnly();
        }
      }
    });
  }

  // Update deleteAllDistributions method to transform distribution IDs
  private deleteAllDistributions(distributionIds: string[]): void {
    let completedCount = 0;
    let errorCount = 0;
    const totalCount = distributionIds.length;
    
    this.toastrService.info(
      this.translation.instant('TOAST_DELETING_DISTRIBUTIONS', {count: totalCount}),
      this.translation.instant('TOAST_DELETION_IN_PROGRESS_TITLE')
    );
    
    distributionIds.forEach(distId => {
      // Transform the distribution ID format before sending to API
      const transformedDistId = distId.replace("urn:ngsi-ld:Dataset:items:", "urn:ngsi-ld:DistributionDCAT-AP:id:");
      
      this.ngsiDatasetsService.deleteDistribution(transformedDistId).subscribe({
        next: () => {
          completedCount++;
          // Check if all operations completed
          if (completedCount + errorCount === totalCount) {
            if (errorCount > 0) {
              this.toastrService.warning(
                this.translation.instant('TOAST_DISTRIBUTIONS_PARTIAL_DELETION', {
                  successCount: completedCount,
                  errorCount: errorCount
                }),
                this.translation.instant('TOAST_PARTIAL_DELETION')
              );
            }
            // Proceed with dataset deletion after all distributions are processed
            this.deleteAllDatasetsOnly();
          }
        },
        error: (error) => {
          console.error(`Error deleting distribution ${transformedDistId}:`, error);
          errorCount++;
          if (completedCount + errorCount === totalCount) {
            this.toastrService.warning(
              this.translation.instant('TOAST_DISTRIBUTIONS_PARTIAL_DELETION', {
                successCount: completedCount,
                errorCount: errorCount
              }),
              this.translation.instant('TOAST_PARTIAL_DELETION')
            );
            // Still proceed with dataset deletion even if some distribution deletions failed
            this.deleteAllDatasetsOnly();
          }
        }
      });
    });
  }

  // Metodo modificato per eliminare solo i dataset
  private deleteAllDatasetsOnly(): void {
    let completedCount = 0;
    let errorCount = 0;
    const totalCount = this.ngsiDatasetsInfo.length;
    
    // Get all dataset IDs
    const allDatasetIds = this.ngsiDatasetsInfo.map(ds => ds.id);
    
    this.toastrService.info(
      this.translation.instant('TOAST_DELETING_DATASETS', {count: totalCount}),
      this.translation.instant('TOAST_DELETION_IN_PROGRESS_TITLE')
    );
    
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

  // Helper method to finalize all deletion
  private finalizeAllDeletion(successCount: number, errorCount: number): void {
    if (errorCount === 0) {
      // All deletions successful
      this.ngsiDatasetsInfo = [];
      this.displayedDatasets = [];
      this.datasetsToDelete = [];
      
      this.toastrService.success(
        this.translation.instant('TOAST_ALL_DATASETS_DELETED', {count: successCount}),
        this.translation.instant('TOAST_SUCCESS')
      );
    } else if (successCount === 0) {
      this.toastrService.danger(
        this.translation.instant('TOAST_NO_DATASETS_DELETED'),
        this.translation.instant('TOAST_ERROR')
      );
    } else {
      this.toastrService.warning(
        this.translation.instant('TOAST_DATASETS_PARTIAL_DELETION', {
          successCount: successCount,
          errorCount: errorCount
        }),
        this.translation.instant('TOAST_PARTIAL_SUCCESS')
      );
    }
  }

  private checkArrayContains(arr: any, value: string): boolean {
    if (!arr) return false;
    if (Array.isArray(arr)) {
      return arr.some(item => item.toLowerCase().includes(value));
    }
    if (typeof arr === 'string') {
      return arr.toLowerCase().includes(value);
    }
    return false;
  }

  private checkFieldContains(obj: any, field: string, value: string): boolean {
    if (!obj || !obj[field]) return false;
    
    const fieldValue = obj[field];
    if (Array.isArray(fieldValue)) {
      return fieldValue.includes(value);
    }
    return fieldValue === value;
  }

  getColor(format:string):string{
    switch(format){
      case 'AGRI':
        return '#74cbec';
      case 'ECON':
        return '#2db55d';
      case 'EDUC':
        return '#ef7100';
      case 'ENVI':
        return '#dfb100';
      case 'ENER':
        return '#55a1ce';
      case 'GOVE':
        return '#2db55d';
      case 'HEAL':
        return '#686868';
      case 'JUST':
        return '#ec96be';
      case 'INTR':
        return '#e0051e';
      case 'REGI':
        return '#fd455f';
      case 'SOCI':
        return '#d00666';
      case 'TECH':
        return '#fg4a52';
      case 'TRAN':
        return '#bfa500';
    }
  }

  isThemeArray(theme: string | []): [] | string[] {
    // Check if theme is an array or a string and return accordingly
    if (Array.isArray(theme)) {
      return theme;
    } else if (typeof theme === 'string') {
      return [theme];
    }
  }

  isKeywordArray(keyword: string | []): [] | string[] {
    // Check if keyword is an array or a string and return accordingly
    if (Array.isArray(keyword)) {
      return keyword;
    } else if (typeof keyword === 'string') {
      return [keyword];
    }
  }

  isPublisherArray(publisher: string | []): [] | string[] {
    // Check if publisher is an array or a string and return accordingly
    if (Array.isArray(publisher)) {
      return publisher;
    } else if (typeof publisher === 'string') {
      return [publisher];
    } 
  }

}
