import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NgsiDatasetsService } from '../services/ngsi-datasets.service';
import { NbDialogService, NbTagComponent, NbTagInputAddEvent, NbToastrService } from '@nebular/theme';
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog.component';
import { Router } from '@angular/router';


@Component({
  selector: 'ngx-data-sources',
  templateUrl: './data-sources.component.html',
  styleUrls: ['./data-sources.component.scss']
})
export class DataSourcesComponent implements OnInit {

  // Store all fetched data here
  modelsInfo: any[] = [];
  // Store the data to be displayed after filtering
  filteredModels: any[] = [];
  // Store the displayed models (paginated)
  displayedModels: any[] = [];
  // Store the models to be deleted
  modelsToDelete: any[] = [];
  totalModels: number = 0;
  currentModels: number = 0;
  
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
    private modelsToolsService: NgsiDatasetsService,
    private dialogService: NbDialogService,
    private toastrService: NbToastrService
  ) { }

  ngOnInit(): void {
    //clear localStorage to avoid conflicts with other components
    localStorage.removeItem('model_to_edit');

    // Call the method in your service
    this.loadModels();
  }

  loadModels(): void {
    this.loading = true;
    // Subscribe to the Observable from your service
    this.modelsToolsService.getDatasets().subscribe({
      next: (response) => {
        // Save the fetched data into a component property
        this.modelsInfo = response;
        this.filteredModels = [...this.modelsInfo];
        this.totalModels = this.modelsInfo.length;
        this.currentModels = this.totalModels;
        
        // Update search response for template
        this.searchResponse.results = this.modelsInfo;
        this.searchResponse.count = this.modelsInfo.length;
        
        // Generate facets from your data
        this.searchResponse.facets = this.generateFacets(this.modelsInfo);
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error in GET request:', error);
        this.loading = false;
      }
    });
  }
  
  // Generate facets from models
  generateFacets(models: any[]): any[] {
    const facets = [];
    
    // Example: themes facet
    const themes = new Set<string>();
    models.forEach(model => {
      if (model.theme) {
        if (Array.isArray(model.theme)) {
          model.theme.forEach(t => themes.add(t));
        } else {
          themes.add(model.theme);
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
    
    // Keywords facet
    const keywords = new Set<string>();
    models.forEach(model => {
      if (model.keyword) {
        if (Array.isArray(model.keyword)) {
          model.keyword.forEach(k => keywords.add(k));
        } else {
          keywords.add(model.keyword);
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

    // Publishers facet
    const publishers = new Set<string>();
    models.forEach(model => {
      if (model.publisher) {
        if (Array.isArray(model.publisher)) {
          model.publisher.forEach(p => publishers.add(p));
        } else {
          publishers.add(model.publisher);
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

  toggle(modelId: string): void {
    const index = this.modelsToDelete.indexOf(modelId);
    if (index > -1) {
      this.modelsToDelete.splice(index, 1);
    } else {
      this.modelsToDelete.push(modelId);
    }
  }

  isChecked(modelId: string): boolean {
    return this.modelsToDelete.includes(modelId);
  }

  // Add filter removal method
  onFilterRemove(tagToRemove: NbTagComponent): void {
    this.filtersTags = this.filtersTags.filter(tag => tag !== tagToRemove.text);
    this.currentPage = 1;
    this.applyFilters();
  }

  // Delete a single model
  deleteModel(modelId: string): void {
    // Find the model to get its details
    const model = this.modelsInfo.find(m => m.id === modelId);
    if (!model) {
      this.toastrService.danger('Model not found', 'Error');
      return;
    }

    // Ensure modelDistribution is always an array
    const distributionIds = Array.isArray(model.modelDistribution) 
      ? model.modelDistribution 
      : (model.modelDistribution ? [model.modelDistribution] : []);

    this.dialogService.open(ConfirmationDialogComponent, {
      context: {
        title: 'Delete Model',
        message: `Are you sure you want to delete this model${distributionIds.length > 0 ? ' and its ' + distributionIds.length + ' associated distributions' : ''}?`,
      },
    }).onClose.subscribe(confirmed => {
      if (confirmed) {
        // If no distributions, just delete the model
        if (distributionIds.length === 0) {
          this.performModelDeletion(modelId);
          return;
        }

        // Track distribution deletions
        let deletedCount = 0;
        let errorCount = 0;
        
        // Delete each distribution first
        distributionIds.forEach(distId => {
          // Transform the distribution ID format if needed
          const transformedDistId = distId.replace("urn:ngsi-ld:Model:items:", "urn:ngsi-ld:DistributionDCAT-AP:id:");
          
          this.modelsToolsService.deleteDistribution(transformedDistId).subscribe({
            next: () => {
              deletedCount++;
              // When all distributions are processed, delete the model
              if (deletedCount + errorCount === distributionIds.length) {
                this.performModelDeletion(modelId);
              }
            },
            error: (error) => {
              console.error(`Error deleting distribution ${transformedDistId}:`, error);
              errorCount++;
              if (deletedCount + errorCount === distributionIds.length) {
                if (errorCount > 0) {
                  this.toastrService.warning(
                    `Failed to delete ${errorCount} distributions. Proceeding with model deletion.`,
                    'Warning'
                  );
                }
                // Still try to delete the model even if some distributions failed
                this.performModelDeletion(modelId);
              }
            }
          });
        });
      }
    });
  }

  // Helper method to delete the model and update UI
  private performModelDeletion(modelId: string): void {
    this.modelsToolsService.deleteDataset(modelId).subscribe({
      next: () => {
        // Remove model from all model collections
        this.modelsInfo = this.modelsInfo.filter(m => m.id !== modelId);
        this.filteredModels = this.filteredModels.filter(m => m.id !== modelId);
        
        // Update counts
        this.totalModels = this.modelsInfo.length;
        this.currentModels = this.filteredModels.length;
        
        // Update search response
        this.searchResponse.results = this.filteredModels;
        this.searchResponse.count = this.filteredModels.length;
        
        // Regenerate facets as they may have changed
        this.searchResponse.facets = this.generateFacets(this.modelsInfo);
        
        // Check if we need to adjust current page
        const totalPages = Math.ceil(this.filteredModels.length / this.pageSize);
        if (this.currentPage > totalPages && totalPages > 0) {
          this.currentPage = totalPages;
        }
        
        // Apply pagination
        this.pageChanged(this.currentPage);
        
        // Remove from delete selection if it was there
        const index = this.modelsToDelete.indexOf(modelId);
        if (index > -1) {
          this.modelsToDelete.splice(index, 1);
        }
        
        this.toastrService.success('Model and associated distributions deleted successfully', 'Success');
      },
      error: (error) => {
        console.error('Error deleting model:', error);
        this.toastrService.danger('Failed to delete model: ' + (error.message || 'Unknown error'), 'Error');
      }
    });
  }

  // The rest of the methods follow the same pattern of replacing "dataset" with "model"
  // You can continue adapting them as needed for your models implementation
  
  // Add page change handler
  pageChanged(pageNumber: number): void {
    this.currentPage = pageNumber;
    // Update displayed models based on current page
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedModels = this.filteredModels.slice(startIndex, endIndex);
    this.searchResponse.results = this.displayedModels; // Update search results
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
    return values || [];
  }
  
  // Method to filter by facet
  getModelByFacet(search_parameter: string, search_value: string): void {
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
  
  // Apply filters to models
  applyFilters(): void {
    // Reset filtered models to all models first
    this.filteredModels = [...this.modelsInfo];
    
    // Apply keyword search filters
    if (this.filters.length > 0) {
      this.filteredModels = this.filteredModels.filter(model => {
        // Check if any filter matches the title, description, or other fields
        return this.filters.some(filter => {
          const lowerFilter = filter.toLowerCase();
          
          // Check title
          if (model.title && model.title.toLowerCase().includes(lowerFilter)) {
            return true;
          }
          
          // Check description
          if (model.description && model.description.toLowerCase().includes(lowerFilter)) {
            return true;
          }
          
          // Check keywords
          if (model.keyword) {
            if (Array.isArray(model.keyword)) {
              if (model.keyword.some((kw: string) => kw.toLowerCase().includes(lowerFilter))) {
                return true;
              }
            } else if (model.keyword.toLowerCase().includes(lowerFilter)) {
              return true;
            }
          }
          
          // Check themes
          if (model.theme) {
            if (Array.isArray(model.theme)) {
              if (model.theme.some((theme: string) => theme.toLowerCase().includes(lowerFilter))) {
                return true;
              }
            } else if (model.theme.toLowerCase().includes(lowerFilter)) {
              return true;
            }
          }
          
          // Check publishers
          if (model.publisher) {
            if (Array.isArray(model.publisher)) {
              if (model.publisher.some((pub: string) => pub.toLowerCase().includes(lowerFilter))) {
                return true;
              }
            } else if (model.publisher.toLowerCase().includes(lowerFilter)) {
              return true;
            }
          }
          
          return false;
        });
      });
    }
    
    // Apply facet filters
    if (this.filtersTags.length > 0) {
      this.filtersTags.forEach(tag => {
        const [facetName, facetValue] = tag.split(': ');
        const searchParam = this.searchResponse.facets.find(
          (f: any) => f.displayName === facetName
        )?.search_parameter;
        
        if (searchParam) {
          this.filteredModels = this.filteredModels.filter(model => {
            return this.checkFieldContains(model, searchParam, facetValue);
          });
        }
      });
    }
    
    // Update counts and search response
    this.currentModels = this.filteredModels.length;
    this.searchResponse.count = this.filteredModels.length;
    
    // Reset to first page when filters change
    if (this.currentPage !== 1) {
      this.currentPage = 1;
    }
    
    // Apply pagination
    this.pageChanged(this.currentPage);
  }
  
  // Delete all selected models
  deleteSelectedModels(): void {
    if (this.modelsToDelete.length === 0) {
      this.toastrService.warning(this.translation.instant('NO_MODELS_SELECTED'), 'Warning');
      return;
    }

    // Count how many distributions will be deleted
    let distributionCount = 0;
    this.modelsToDelete.forEach(modelId => {
      const model = this.modelsInfo.find(m => m.id === modelId);
      if (model) {
        // Get distributions for this model
        const distributions = Array.isArray(model.modelDistribution) 
          ? model.modelDistribution 
          : (model.modelDistribution ? [model.modelDistribution] : []);
        
        distributionCount += distributions.length;
      }
    });

    this.dialogService.open(ConfirmationDialogComponent, {
      context: {
        title: this.translation.instant('DIALOG_DELETE_SELECTED_MODELS'),
        message: this.translation.instant('DIALOG_DELETE_SELECTED_MODELS_MESSAGE', {
          modelCount: this.modelsToDelete.length,
          distributionCount: distributionCount
        }),
      },
    }).onClose.subscribe(confirmed => {
      if (confirmed) {
        let successCount = 0;
        let errorCount = 0;
        
        // Process each model ID
        this.modelsToDelete.forEach(modelId => {
          this.deleteModel(modelId);
        });
      }
    });
  }

  // Function to delete all models
  deleteAllModels(): void {
    if (this.modelsInfo.length === 0) {
      this.toastrService.warning(this.translation.instant('NO_MODELS_TO_DELETE'), 'Warning');
      return;
    }

    // Count total distributions
    let distributionCount = 0;
    this.modelsInfo.forEach(model => {
      const distributions = Array.isArray(model.modelDistribution) 
        ? model.modelDistribution 
        : (model.modelDistribution ? [model.modelDistribution] : []);
      
      distributionCount += distributions.length;
    });

    this.dialogService.open(ConfirmationDialogComponent, {
      context: {
        title: this.translation.instant('DIALOG_DELETE_ALL_MODELS'),
        message: this.translation.instant('DIALOG_DELETE_ALL_MODELS_MESSAGE', {
          modelCount: this.modelsInfo.length,
          distributionCount: distributionCount
        }),
      },
    }).onClose.subscribe(confirmed => {
      if (confirmed) {
        this.deleteAllDistributions();
      }
    });
  }

  // Helper method to delete all distributions, then all models
  private deleteAllDistributions(): void {
    // Gather all distribution IDs
    const allDistributionIds: string[] = [];
    this.modelsInfo.forEach(model => {
      const distributions = Array.isArray(model.modelDistribution) 
        ? model.modelDistribution 
        : (model.modelDistribution ? [model.modelDistribution] : []);
      
      distributions.forEach((distId: string) => {
        // Transform distribution ID format if needed
        const transformedDistId = distId.replace("urn:ngsi-ld:Model:items:", "urn:ngsi-ld:DistributionDCAT-AP:id:");
        allDistributionIds.push(transformedDistId);
      });
    });

    // If no distributions, just delete all models
    if (allDistributionIds.length === 0) {
      this.deleteAllModelsOnly();
      return;
    }

    // Track progress
    let successCount = 0;
    let errorCount = 0;

    // Delete each distribution
    allDistributionIds.forEach(distId => {
      this.modelsToolsService.deleteDistribution(distId).subscribe({
        next: () => {
          successCount++;
          if (successCount + errorCount === allDistributionIds.length) {
            // When all distributions are processed, delete all models
            this.deleteAllModelsOnly();
          }
        },
        error: (error) => {
          console.error(`Error deleting distribution ${distId}:`, error);
          errorCount++;
          if (successCount + errorCount === allDistributionIds.length) {
            if (errorCount > 0) {
              this.toastrService.warning(
                `Failed to delete ${errorCount} distributions. Proceeding with model deletion.`,
                'Warning'
              );
            }
            // Still try to delete all models even if some distributions failed
            this.deleteAllModelsOnly();
          }
        }
      });
    });
  }

  // Method to delete only the models
  private deleteAllModelsOnly(): void {
    // Get all model IDs
    const allModelIds = this.modelsInfo.map(model => model.id);
    
    // Track progress
    let successCount = 0;
    let errorCount = 0;

    // Delete each model
    allModelIds.forEach(modelId => {
      this.modelsToolsService.deleteDataset(modelId).subscribe({
        next: () => {
          successCount++;
          if (successCount + errorCount === allModelIds.length) {
            this.finalizeAllDeletion(successCount, errorCount);
          }
        },
        error: (error) => {
          console.error(`Error deleting model ${modelId}:`, error);
          errorCount++;
          if (successCount + errorCount === allModelIds.length) {
            this.finalizeAllDeletion(successCount, errorCount);
          }
        }
      });
    });
  }

  // Helper method to finalize all deletion
  private finalizeAllDeletion(successCount: number, errorCount: number): void {
    // Clear the deletion list
    this.modelsToDelete = [];
    
    // Show appropriate message
    if (errorCount === 0) {
      this.toastrService.success(
        `Successfully deleted all ${successCount} models and their distributions.`,
        'Success'
      );
    } else if (successCount === 0) {
      this.toastrService.danger(
        `Failed to delete any models.`,
        'Error'
      );
    } else {
      this.toastrService.warning(
        `Deleted ${successCount} models, but failed to delete ${errorCount} models.`,
        'Partial Success'
      );
    }
    
    // Refresh the model list
    this.loadModels();
  }

  // Edit a model
  editModel(modelId: string): void {
    // Find the model with this ID
    const modelToEdit = this.modelsInfo.find(model => model.id === modelId);
   
    // Ensure modelDistribution is always an array before storing
    if (modelToEdit) {
      if (modelToEdit.modelDistribution && !Array.isArray(modelToEdit.modelDistribution)) {
        modelToEdit.modelDistribution = [modelToEdit.modelDistribution];
      }
      
      // Store the model in localStorage for the editor component
      localStorage.setItem('model_to_edit', JSON.stringify(modelToEdit));
      
      // Navigate to the editor route
      this.router.navigate(['/pages/data-sources/editor']);
    } else {
      this.toastrService.danger('Model not found', 'Error');
    }
  }

  // Helper functions for template rendering
  private checkArrayContains(arr: any, value: string): boolean {
    if (!arr) return false;
    if (!Array.isArray(arr)) return arr.toLowerCase().includes(value.toLowerCase());
    return arr.some((item: string) => item.toLowerCase().includes(value.toLowerCase()));
  }

  private checkFieldContains(obj: any, field: string, value: string): boolean {
    if (!obj || !obj[field]) return false;
    return this.checkArrayContains(obj[field], value);
  }

  getColor(format: string): string {
    // Generate consistent color based on string hash
    let hash = 0;
    for (let i = 0; i < format.length; i++) {
      hash = format.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 80%)`;
  }

  isThemeArray(theme: string | []): [] | string[] {
    if (!theme) return [];
    return Array.isArray(theme) ? theme : [theme];
  }

  isKeywordArray(keyword: string | []): [] | string[] {
    if (!keyword) return [];
    return Array.isArray(keyword) ? keyword : [keyword];
  }

  isPublisherArray(publisher: string | []): [] | string[] {
    if (!publisher) return [];
    return Array.isArray(publisher) ? publisher : [publisher];
  }

}
