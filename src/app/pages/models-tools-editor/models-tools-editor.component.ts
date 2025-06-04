import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn, ValidationErrors } from '@angular/forms';
import { NgsiDatasetsService } from '../services/ngsi-datasets.service';
import { Router } from '@angular/router';
import moment from 'moment';
import { NbDialogService, NbToastrService } from '@nebular/theme';
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ngx-models-tools-editor',
  templateUrl: './models-tools-editor.component.html',
  styleUrls: ['./models-tools-editor.component.scss']
})
export class ModelsToolsEditorComponent implements OnInit {

  selectedStepIndex = 0;
  
  distributionForm: FormGroup;
  distributions: any[] = [];
  
  datasetForm: FormGroup;
  
  loadingDistributions: boolean = false;

  deletingDistributions: { [key: string]: boolean } = {};

  isEditing: boolean = false;

  isEditingDistribution: boolean = false;
  currentEditingDistributionId: string = null;

  isCreatingDataset: boolean = false;
  pendingDistributions: any[] = [];

  distributionsToDelete: string[] = []; // Array of distribution IDs to delete

  existingDatasetIds: string[] = []; // Array to store existing dataset IDs

  // Array to store the keywords
  keywordArray: string[] = [];

  // Array to store the contact points
  contactPointArray: string[] = [];

  constructor(
        private fb: FormBuilder,
        private ngsiDatasetsService: NgsiDatasetsService,
        private router: Router,
        private dialogService: NbDialogService,
        private toastrService: NbToastrService,
        public translation: TranslateService
  ) { }

  ngOnInit(): void {

    // Initialize form
    this.initForms();
    
    // Load existing dataset IDs for validation
    this.loadExistingDatasetIds();
    
    // Check if we're editing an existing dataset
    const storedDataset = localStorage.getItem('dataset_to_edit');
    if (storedDataset) {
      try {
        const parsedDataset = JSON.parse(storedDataset);
        this.isEditing = true; // Set editing flag to true
        
        // Populate the form with existing data
        this.populateDatasetForm(parsedDataset);
        
        // Load only distributions associated with this dataset
        this.loadDistributionsForDataset(parsedDataset);
      } catch (error) {
        console.error('Error parsing dataset from localStorage:', error);
        this.isEditing = false;
        // Start with an empty distributions list for new datasets
        this.distributions = [];
      }
    } else {
      this.isEditing = false;
      // Start with an empty distributions list for new datasets
      this.distributions = [];
    }
  }

  // Add this method to handle stepper step changes
  onStepChange(stepperIndex: number): void {

    this.selectedStepIndex = stepperIndex;
    
  }

  // Initialize forms
  initForms(): void {
    // Add validator to distribution form
    this.distributionForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      accessUrl: [''],
      downloadURL: ['', Validators.required], 
      byteSize: [0],
      checksum: [''],
      rights: [''],
      mediaType: [''],
      license: ['CC-BY'],
      releaseDate: [''],
      modifiedDate: ['']
    });


    // Add validator to dataset form with today's date as default for new datasets
    this.datasetForm = this.fb.group({
      title: ['', Validators.required], // Title is required
      description: [''],
      name: [''],
      publisher: [''],
      releaseDate: [this.isEditing ? '' : new Date()],  // Only set default for new datasets
      theme: [[]],  // Initialize as empty array
      creator: [''],
      frequency: [''],
      version: ['']
    });
  }

  // Add this method to edit a distribution
  editDistribution(distribution: any): void {
    this.isEditingDistribution = true;
    this.currentEditingDistributionId = distribution.id;
    
    // Reset and populate the form with existing distribution data
    this.distributionForm.reset();
    
    // Convert arrays to single values for form fields
    const accessUrl = Array.isArray(distribution.accessUrl) && distribution.accessUrl.length > 0 
      ? distribution.accessUrl[0] 
      : '';
    
    // Convert string dates to Date objects for the datepicker
    let releaseDate = null;
    let modifiedDate = null;
    
    if (distribution.releaseDate) {
      const momentReleaseDate = moment(distribution.releaseDate);
      if (momentReleaseDate.isValid()) {
        releaseDate = momentReleaseDate.toDate();
      }
    }
    
    if (distribution.modifiedDate) {
      const momentModifiedDate = moment(distribution.modifiedDate);
      if (momentModifiedDate.isValid()) {
        modifiedDate = momentModifiedDate.toDate();
      }
    }
    
    // Populate the form with existing data
    this.distributionForm.patchValue({
      title: distribution.title,
      description: distribution.description,
      accessUrl: accessUrl,
      downloadURL: distribution.downloadURL,
      byteSize: distribution.byteSize,
      checksum: distribution.checksum,
      rights: distribution.rights,
      mediaType: distribution.mediaType,
      license: distribution.license,
      releaseDate: releaseDate,
      modifiedDate: modifiedDate
    });
    
    // Scroll to the form section
    setTimeout(() => {
      const formElement = document.getElementById('distributionForm');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }

  // Add this helper method to normalize titles or ID for comparison
  private normalizeString(title: string): string {
    // Remove all spaces and convert to lowercase for consistent comparison
    return title.replace(/\s+/g, '').toLowerCase();
  }

  saveDistributionToLocalStorage(): void {
    // Mark all fields as touched to trigger validation display
    this.markFormGroupTouched(this.distributionForm);
    
    if (this.distributionForm.invalid) {
      this.toastrService.danger(
        this.translation.instant('TOAST_FILL_REQUIRED_FIELDS'),
        this.translation.instant('TOAST_FORM_INVALID')
      );
      return;
    }

    const formData = this.distributionForm.value;
  
    // Title is required and must be unique
    if (!formData.title.trim()) {
      this.toastrService.danger(
        this.translation.instant('TOAST_TITLE_REQUIRED'),
        this.translation.instant('TOAST_TITLE_REQUIRED_TITLE')
      );
      return;
    }
    
    // Modified: Check title uniqueness among distributions not being edited (ignore spaces)
    const normalizedNewTitle = this.normalizeString(formData.title);
    if (!this.isEditingDistribution && 
        this.distributions.some(d => this.normalizeString(d.title) === normalizedNewTitle)) {
      this.toastrService.danger(
        this.translation.instant('TOAST_DUPLICATE_TITLE'),
        this.translation.instant('TOAST_DUPLICATE_TITLE_TITLE')
      );
      return;
    }
    
    // Modified: If editing, check if new title conflicts with any other distribution (ignore spaces)
    if (this.isEditingDistribution) {
      const existingDistribution = this.distributions.find(d => d.id === this.currentEditingDistributionId);
      if (this.normalizeString(formData.title) !== this.normalizeString(existingDistribution.title) && 
          this.distributions.some(d => 
            this.normalizeString(d.title) === normalizedNewTitle && 
            d.id !== this.currentEditingDistributionId)) {
        this.toastrService.danger(
          this.translation.instant('TOAST_DUPLICATE_TITLE'),
          this.translation.instant('TOAST_DUPLICATE_TITLE_TITLE')
        );
        return;
      }
    }


    // Find the existing distribution if we're editing
    let existingDistribution = null;
    if (this.isEditingDistribution) {
      existingDistribution = this.distributions.find(d => d.id === this.currentEditingDistributionId);
    }

    // Format the distribution object according to API requirements
    const distribution = {
      // Use the ID from the form if provided, otherwise generate a new one
      // For editing, keep the original ID unless a new one is provided
      title: formData.title,
      description: formData.description || '',
      accessUrl: formData.accessUrl ? [formData.accessUrl] : [''],
      downloadURL: formData.downloadURL,
      byteSize: formData.byteSize || 0,
      checksum: formData.checksum || '',
      rights: formData.rights || '',
      mediaType: formData.mediaType || '',
      license: formData.license || '',
      releaseDate: formData.releaseDate ? 
        moment(formData.releaseDate).format() : 
        moment().format(),
      modifiedDate: formData.modifiedDate ? 
        moment(formData.modifiedDate).format() : 
        moment().format(),
      isNew: this.isEditingDistribution 
        ? existingDistribution?.isNew || false 
        : true,
      isEdited: this.isEditingDistribution
    };
    

  

    if (this.isEditingDistribution) {
      // When editing a local-storage-only distribution, the ID might have changed
      // So we need to update the ID reference for finding the index
      const index = this.distributions.findIndex(d => d.id === this.currentEditingDistributionId);
      if (index !== -1) {
        this.distributions[index] = distribution;
        this.toastrService.success(
          this.translation.instant('TOAST_CHANGES_SAVED'),
          this.translation.instant('TOAST_CHANGES_SAVED_TITLE')
        );
      }
    } else {
      // Add the new distribution to the local array
      this.distributions.push(distribution);
      this.toastrService.success(
        this.translation.instant('TOAST_MODEL_TOOL_ADDED'),
        this.translation.instant('TOAST_MODEL_TOOL_ADDED_TITLE')
      );
    }
    
    // Reset form and editing state
    this.distributionForm.reset();
    this.isEditingDistribution = false;
    this.currentEditingDistributionId = null;
  }

  createDatasetWithDistributions(): void {
    // Mark all fields as touched to trigger validation display
    this.markFormGroupTouched(this.datasetForm);
    
    // Validate dataset form first
    if (this.datasetForm.invalid) {
      this.toastrService.danger(
        this.translation.instant('TOAST_COMPLETE_DATASET_FIELDS'),
        this.translation.instant('TOAST_FORM_INVALID')
      );
      return;
    }
    
      // No ID provided or we're in edit mode, proceed normally
      this.proceedWithDatasetCreation();
  }

  private proceedWithDatasetCreation(): void {
    // Count active distributions (not marked for deletion)
    const activeDistributionsCount = this.distributions.filter(d => !d.markedForDeletion).length;
    
    if (activeDistributionsCount === 0) {
      // Show a dialog instead of just a toastr message
      this.dialogService.open(ConfirmationDialogComponent, {
        context: {
          title: 'Cannot Proceed',
          message: 'You cannot create or update a dataset without any active distributions. Please add at least one distribution or unmark some for deletion.',
          confirmButtonText: 'OK',
          showCancelButton: false
        },
      });
      this.isCreatingDataset = false;
      return;
    }
    
    // Process deletions first, then proceed with the rest of the workflow
    if (this.distributionsToDelete.length > 0) {
      this.processDistributionDeletions(0, () => {
        this.processDistributionCreationsAndUpdates();
      });
    } else {
      this.processDistributionCreationsAndUpdates();
    }
  }

  private processDistributionDeletions(index: number, onComplete: () => void): void {
    if (index >= this.distributionsToDelete.length) {
      // All deletions processed
      onComplete();
      return;
    }
    
    const distributionId = this.distributionsToDelete[index];
    
    this.ngsiDatasetsService.deleteDistribution(distributionId).subscribe({
      next: () => {
        // Process next deletion
        this.processDistributionDeletions(index + 1, onComplete);
      },
      error: (error) => {
        console.error(`Error deleting distribution ${distributionId}:`, error);
        this.isCreatingDataset = false;
        this.toastrService.danger(
          this.translation.instant('TOAST_DELETE_MODEL_TOOL_FAILED'),
          this.translation.instant('TOAST_MODEL_TOOL_DELETION_ERROR')
        );
        // Don't proceed if deletion fails
      }
    });
  }

  private processDistributionCreationsAndUpdates(): void {
    // Filter out distributions marked for deletion
    const activeDistributions = this.distributions.filter(d => !d.markedForDeletion);
    const newDistributions = activeDistributions.filter(d => d.isNew === true);
    const editedDistributions = activeDistributions.filter(d => d.isEdited === true && !d.isNew);
    
    // Create a deep copy of distributions array to avoid modifying the UI list during processing
    this.pendingDistributions = [...newDistributions, ...editedDistributions];
    
    if (this.pendingDistributions.length === 0) {
      // If no distributions need to be created or updated, proceed directly to dataset creation
      this.createOrUpdateDataset();
      return;
    }
    
    // Process distributions sequentially
    this.processNextDistribution(0, () => {
      // All distributions processed successfully, now create the dataset
      this.createOrUpdateDataset();
    });
  }

  private processNextDistribution(index: number, onComplete: () => void): void {
    if (index >= this.pendingDistributions.length) {
      // All distributions processed successfully
      onComplete();
      return;
    }
    
    const distribution = this.pendingDistributions[index];
    
    // Remove the flags we added, which aren't needed for the API
    const { isNew, isEdited, markedForDeletion, ...distToSend } = distribution;
    
    // Choose between create or update based on the isNew flag
    const operation = distribution.isNew 
      ? this.ngsiDatasetsService.createDistribution(distToSend)
      : this.ngsiDatasetsService.updateDistribution(distribution.id, distToSend);
    
    operation.subscribe({
      next: () => {
        // Process the next distribution
        this.processNextDistribution(index + 1, onComplete);
      },
      error: (error) => {
        this.isCreatingDataset = false;
        
        // Handle 409 Conflict error specifically
        if (error.status === 409) {
          this.toastrService.danger(
            this.translation.instant('TOAST_DUPLICATE_MODEL_TOOL', {title: distribution.title}),
            this.translation.instant('TOAST_DUPLICATE_MODEL_TOOL_TITLE')
          );
        } else {
          console.error(`Error ${distribution.isNew ? 'creating' : 'updating'} distribution ${distribution.id}:`, error);
          this.toastrService.danger(
            `Failed to ${distribution.isNew ? 'create' : 'update'} distribution "${distribution.title}". Dataset creation aborted.`,
            'Distribution Error'
          );
        }
        // Do not proceed to dataset creation
      }
    });
  }

  private createOrUpdateDataset(): void {
    const formValue = this.datasetForm.getRawValue();
    
    // Get only distribution IDs that aren't marked for deletion
    const datasetDistribution = this.distributions
      .filter(dist => !dist.markedForDeletion)
      .map(dist => dist.id);
    
    // Format date with time component using Moment.js
    const releaseDate = formValue.releaseDate ? 
      moment(formValue.releaseDate).format() : 
      null;
    
    // Check if the theme array is empty and apply the [""]
    const themeValue = !formValue.theme || formValue.theme.length === 0 ? [""] : formValue.theme;
    
    // Check if frequency is null or undefined and apply ""
    const frequencyValue = !formValue.frequency ? "" : formValue.frequency;
    
    // Create the dataset object including keywords, contact points, and themes
    let dataset = {
      ...formValue,
      releaseDate,
      datasetDistribution,
      contactPoint: this.contactPointArray.length === 0 ? [""] : this.contactPointArray,
      keyword: this.keywordArray.length === 0 ? [""] : this.keywordArray,
      theme: themeValue,
      accessRights: 'public'
    };
    
    
    // Remove ID from the payload when updating
    const datasetId = JSON.parse(localStorage.getItem('dataset_to_edit'))?.id;
    if (this.isEditing) {
      const { id, ...datasetWithoutId } = dataset;
      dataset = datasetWithoutId;
    }
    
    // Choose between create or update
    let operation: any;
    if (this.isEditing) {
      // if editing, remove "urn:ngsi-ld:DistributionDCAT-AP:id:" prefix from the distributuions ID
      const updatedDistributions = dataset.datasetDistribution.map((distId: string) => {
        return distId.replace('urn:ngsi-ld:DistributionDCAT-AP:id:', '');
      });

      dataset.datasetDistribution = updatedDistributions;

      operation = this.ngsiDatasetsService.updateDataset(datasetId, dataset);
    } else {
      operation = this.ngsiDatasetsService.createDataset(dataset);
    }
    
    operation.subscribe({
      next: () => {
        // Clear localStorage
        localStorage.removeItem('dataset_to_edit');
        // Reset form and navigate back
        this.datasetForm.reset();
        this.distributions = [];
        this.isCreatingDataset = false;
        this.router.navigate(['/pages/models-tools']);
        this.toastrService.success(
          this.isEditing ? 
            this.translation.instant('TOAST_DATASET_UPDATED') : 
            this.translation.instant('TOAST_DATASET_CREATED'),
          this.translation.instant('TOAST_SUCCESS')
        );
      },
      error: (error) => {
        console.error(`Error ${this.isEditing ? 'updating' : 'creating'} dataset:`, error);
        this.isCreatingDataset = false;
        this.toastrService.danger(
          `Failed to ${this.isEditing ? 'update' : 'create'} dataset: ${error.message || 'Unknown error'}`,
          'Dataset Error'
        );
      }
    });
  }

  cancelEditDistribution(): void {
    this.distributionForm.reset();
    this.isEditingDistribution = false;
    this.currentEditingDistributionId = null;
  }

  removeDistribution(index: number): void {
    const distributionToDelete = this.distributions[index];
    
    if (!distributionToDelete || !distributionToDelete.title) {
      console.error('Invalid distribution or missing title');
      return;
    }
    
    this.dialogService.open(ConfirmationDialogComponent, {
      context: {
        title: 'Mark Distribution for Deletion',
        message: `Are you sure you want to delete distribution "${distributionToDelete.title}"? The deletion will be processed when the dataset is updated.`,
      },
    }).onClose.subscribe(confirmed => {
      if (confirmed) {
        // If it's a new distribution (not yet persisted), just remove it from the list
        if (distributionToDelete.isNew) {
          this.distributions.splice(index, 1);
          this.toastrService.info(
            this.translation.instant('TOAST_MODEL_TOOL_REMOVED', {title: distributionToDelete.title}),
            this.translation.instant('TOAST_MODEL_TOOL_REMOVED_TITLE')
          );
        } else {
          // Mark existing distribution for deletion
          distributionToDelete.markedForDeletion = true;
          
          // Add to array of distributions to delete
          if (!this.distributionsToDelete.includes(distributionToDelete.id)) {
            this.distributionsToDelete.push(distributionToDelete.id);
          }
          
          this.toastrService.info(
            this.translation.instant('TOAST_MODEL_TOOL_MARKED_DELETION', {title: distributionToDelete.title}),
            this.translation.instant('TOAST_MODEL_TOOL_MARKED_DELETION_TITLE')
          );
        }
      }
    });
  }

  undoDeleteDistribution(index: number): void {
    const distribution = this.distributions[index];
    
    if (distribution) {
      // Remove the markedForDeletion flag
      distribution.markedForDeletion = false;
      
      // Remove from distributionsToDelete array
      const deleteIndex = this.distributionsToDelete.indexOf(distribution.id);
      if (deleteIndex !== -1) {
        this.distributionsToDelete.splice(deleteIndex, 1);
      }
      
      this.toastrService.success(
        this.translation.instant('TOAST_MODEL_TOOL_RESTORED', {title: distribution.title}),
        this.translation.instant('TOAST_MODEL_TOOL_RESTORED_TITLE')
      );
    }
  }

  /**
   * Removes a distribution from the local list without deleting it from the system
   * @param index Index of the distribution to remove
   */
  removeDistributionFromList(index: number): void {
    if (index < 0 || index >= this.distributions.length) {
      console.error('Invalid distribution index:', index);
      return;
    }
    
    const distributionToRemove = this.distributions[index];
    
    this.dialogService.open(ConfirmationDialogComponent, {
      context: {
        title: 'Remove Distribution',
        message: `Are you sure you want to remove "${distributionToRemove.title}" from the list? The distribution will not be deleted from the system.`,
      },
    }).onClose.subscribe(confirmed => {
      if (confirmed) {
        // Rimuove la distribuzione solo dall'array locale senza chiamare l'API di eliminazione
        this.distributions.splice(index, 1);
        
        this.toastrService.info(
          this.translation.instant('TOAST_MODEL_TOOL_REMOVED', {title: distributionToRemove.title}),
          this.translation.instant('TOAST_MODEL_TOOL_REMOVED_TITLE')
        );
      }
    });
  }

  onDateSelect(date: Date, controlName: string) {
    if (date) {
      const momentDate = moment(date);
      if (momentDate.isValid()) {
        if (controlName === 'releaseDate') {
          this.distributionForm.get('releaseDate')?.setValue(momentDate.toDate());
        } else if (controlName === 'datasetReleaseDate') {
          this.datasetForm.get('releaseDate')?.setValue(momentDate.toDate());
        }
      }
    }
  }

  loadDistributions(existingDataset: any = null): void {
    this.loadingDistributions = true;
    
    this.ngsiDatasetsService.getDistributions().subscribe({
      next: (response) => {
        if (response && response.length > 0) {
          this.distributions = response;
          
          
          if (existingDataset && existingDataset.datasetDistribution) {
            // For editing: select only distributions that were part of the dataset
            // Ensure distributionIds is always an array
            let distributionIds = existingDataset.datasetDistribution;
            
            // Convert to array if it's not already
            if (!Array.isArray(distributionIds)) {
              if (typeof distributionIds === 'string') {
                // If it's a single string ID, wrap it in an array
                distributionIds = [distributionIds];
              } else {
                // If it's something else entirely, default to empty array
                distributionIds = [];
                console.warn('datasetDistribution is not an array or string:', distributionIds);
              }
            }
            
          } 
        } else {
          console.log('No distributions available');
        }
        this.loadingDistributions = false;
      },
      error: (error) => {
        console.error('Error loading distributions:', error);
        this.loadingDistributions = false;
      }
    });
  }

  // Add a method to populate the form with existing dataset data
  populateDatasetForm(dataset: any): void {
    
    // Parse the date properly using Moment.js
    let releaseDate = new Date(); // Default to today for new datasets

    if (dataset.releaseDate) {
      
      // Check if date is in JSON-LD format with @value property
      if (typeof dataset.releaseDate === 'object' && dataset.releaseDate['@value']) {
        // Extract the date string from @value
        const dateString = dataset.releaseDate['@value'];
        
        // Parse the extracted date string
        const momentDate = moment(dateString);
        if (momentDate.isValid()) {
          releaseDate = momentDate.toDate();
        }
      } else {
        // Process as regular string format (existing code)
        const momentDate = moment(dataset.releaseDate);
        
        if (momentDate.isValid()) {
          releaseDate = momentDate.toDate();
        } else {
          // Try alternative format parsing
          const formats = ['YYYY-MM-DD', 'YYYY/MM/DD', 'DD-MM-YYYY', 'MM/DD/YYYY', 'YYYY-MM-DDTHH:mm:ss.SSSZ'];
          
          for (const format of formats) {
            const parsedDate = moment(dataset.releaseDate, format, true);
            if (parsedDate.isValid()) {
              releaseDate = parsedDate.toDate();
              break;
            }
          }
          
          // If still not valid, log warning but keep original string for debugging
          if (!moment(releaseDate).isValid()) {
            console.warn('Could not parse date:', dataset.releaseDate);
            // Keep today's date as fallback
          }
        }
      }
    }
    
    // Set theme correctly based on type
    let themeValue = [];
    if (dataset.theme) {
      if (Array.isArray(dataset.theme)) {
        themeValue = dataset.theme;
      } else if (typeof dataset.theme === 'string') {
        themeValue = [dataset.theme]; // Convert single string to array with one element
      }
    }
    
    // Set simple fields
    this.datasetForm.patchValue({
      id: dataset.id || '',
      title: dataset.title || '',
      description: dataset.description || '',
      name: dataset.name || '',
      publisher: dataset.publisher || '',
      releaseDate: releaseDate, 
      creator: dataset.creator || '',
      frequency: dataset.frequency || '',
      version: dataset.version || '',
      theme: themeValue 
    });
    
    // Set contact points using contactPointArray
    if (dataset.contactPoint) {
      if (Array.isArray(dataset.contactPoint)) {
        this.contactPointArray = [...dataset.contactPoint];
      } else if (typeof dataset.contactPoint === 'string') {
        this.contactPointArray = [dataset.contactPoint];
      } else {
        this.contactPointArray = [];
      }
  
    } else {
      this.contactPointArray = [];
    }
    
    
    // Set keywords using keywordArray - handle different possible formats
    if (dataset.keyword) {
      if (Array.isArray(dataset.keyword)) {
        // It's already an array, use it directly
        this.keywordArray = [...dataset.keyword];
      } else if (typeof dataset.keyword === 'string') {
        // It's a string, try to split it if it contains commas
        this.keywordArray = dataset.keyword.split(',').map(k => k.trim()).filter(k => k);
      } else {
        // Unknown format, initialize empty array
        this.keywordArray = [];
      }
    } else {
      // No keywords, initialize empty array
      this.keywordArray = [];
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.distributionForm.get(fieldName);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // New method to load only distributions associated with a dataset
  loadDistributionsForDataset(dataset: any): void {
    if (!dataset || !dataset.datasetDistribution) {
      this.distributions = [];
      return;
    }

    this.loadingDistributions = true;
    
    // Ensure distributionIds is always an array
    let distributionIds = dataset.datasetDistribution;
    if (!Array.isArray(distributionIds)) {
      distributionIds = typeof distributionIds === 'string' ? [distributionIds] : [];
    }
    
    if (distributionIds.length === 0) {
      this.loadingDistributions = false;
      this.distributions = [];
      return;
    }

    // Get all distributions and filter them
    this.ngsiDatasetsService.getDistributions().subscribe({
      next: (allDistributions) => {
        if (!allDistributions || allDistributions.length === 0) {
          this.distributions = [];
          this.loadingDistributions = false;
          return;
        }
        
        // Filter to keep only distributions associated with this dataset
        this.distributions = allDistributions.filter(dist => {
          return distributionIds.some(datasetId => {
            // Convert both to strings for consistency
            const dsId = String(datasetId);
            const distId = String(dist.id);
            
            // Direct match
            if (dsId === distId) return true;
            
            // Extract identifier part after "id:" or "items:" in both IDs
            const getIdPart = (id: string): string => {
              if (id.includes(':id:')) {
                return id.split(':id:')[1];
              } else if (id.includes(':items:')) {
                return id.split(':items:')[1];
              }
              return id;
            };
            
            const datasetIdPart = getIdPart(dsId);
            const distributionIdPart = getIdPart(distId);
            
            // Compare the extracted identifier parts
            return datasetIdPart === distributionIdPart;
          });
        });
        
        this.loadingDistributions = false;
      },
      error: (error) => {
        console.error('Error loading distributions for dataset:', error);
        this.distributions = [];
        this.loadingDistributions = false;
      }
    });
  }

  // Add this method to load existing dataset IDs
  loadExistingDatasetIds(): void {
    this.ngsiDatasetsService.getDatasets().subscribe({
      next: (datasets) => {
        this.existingDatasetIds = datasets.map(dataset => dataset.id);
      },
      error: (error) => {
        console.error('Error loading dataset IDs:', error);
        this.existingDatasetIds = [];
      }
    });
  }

  // Method to add a keyword from the input field
  addKeywordFromInput(inputElement: HTMLInputElement): void {
    const value = inputElement.value?.trim();
    
    if (value && value.length > 0) {
      // Check if we've reached the maximum number of keywords
      if (this.keywordArray.length >= 10) {
        this.toastrService.warning(
          this.translation.instant('TOAST_KEYWORDS_LIMIT'),
          this.translation.instant('TOAST_KEYWORDS_LIMIT_TITLE')
        );
        return;
      }
      
      // Check for duplicates (case-insensitive)
      const isDuplicate = this.keywordArray.some(
        keyword => keyword.toLowerCase() === value.toLowerCase()
      );
      
      if (!isDuplicate) {
        this.keywordArray.push(value);
      } else {
        this.toastrService.warning(
          this.translation.instant('TOAST_DUPLICATE_KEYWORD', {value: value}),
          this.translation.instant('TOAST_DUPLICATE_KEYWORD_TITLE')
        );
      }
      
      // Clear the input
      inputElement.value = '';
      
      // Focus back on the input for easy addition of multiple tags
      inputElement.focus();
    }
  }

  // Method to remove a keyword from the array
  removeKeywordTag(keyword: string): void {
    const index = this.keywordArray.indexOf(keyword);
    if (index !== -1) {
      this.keywordArray.splice(index, 1);
    }
  }

  // Method to add a contact point from the input field
  addContactPointFromInput(inputElement: HTMLInputElement): void {
    const value = inputElement.value?.trim();
    
    if (value && value.length > 0) {
      // Check if we've reached the maximum number of contact points
      if (this.contactPointArray.length >= 5) {
        this.toastrService.warning(
          this.translation.instant('TOAST_CONTACT_POINTS_LIMIT'),
          this.translation.instant('TOAST_CONTACT_POINTS_LIMIT_TITLE')
        );
        return;
      }
      
      // Check for duplicates (case-insensitive)
      const isDuplicate = this.contactPointArray.some(
        contact => contact.toLowerCase() === value.toLowerCase()
      );
      
      if (!isDuplicate) {
        this.contactPointArray.push(value);
      } else {
        this.toastrService.warning(
          `Contact point "${value}" already exists`,
          'Duplicate Contact Point'
        );
      }
      
      // Clear the input
      inputElement.value = '';
      
      // Focus back on the input for easy addition of multiple contact points
      inputElement.focus();
    }
  }

  // Method to remove a contact point from the array
  removeContactPointTag(contact: string): void {
    const index = this.contactPointArray.indexOf(contact);
    if (index !== -1) {
      this.contactPointArray.splice(index, 1);
    }
  }

  isDatasetFormValid(): boolean {
    // Check if form is valid
    if (this.datasetForm.invalid) {
      return false;
    }
    
    // Check required fields explicitly
    const title = this.datasetForm.get('title');
    const releaseDate = this.datasetForm.get('releaseDate');
    
    if (!title?.value || !releaseDate?.value) {
      return false;
    }
    
    // Check if there are any distributions
    return this.distributions.length > 0;
  }

}