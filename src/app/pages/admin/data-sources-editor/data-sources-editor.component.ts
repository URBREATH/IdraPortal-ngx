import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl, ValidatorFn, ValidationErrors } from '@angular/forms';
import { DatasourceService } from "../../services/datasource.service";
import { Router } from '@angular/router';
import moment from 'moment';
import { NbDialogService, NbToastrService } from '@nebular/theme';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog/confirmation-dialog.component';
import * as L from 'leaflet';
import { MapDialogComponent } from '../../../shared/map-dialog/map-dialog.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ngx-data-sources-editor',
  templateUrl: './data-sources-editor.component.html',
  styleUrls: ['./data-sources-editor.component.scss']
})
export class DataSourcesEditorComponent {

  formatOptions: string[] = [
    'Endpoint',
    'User documentation',
    'API documentation',
    'Other'
  ];

  // Add this property to track if "Other" format is selected
  isOtherFormatSelected: boolean = false;

    selectedStepIndex = 0;
    
    distributionForm: FormGroup;
    distributions: any[] = [];
    
    datasetForm: FormGroup;
    
    loadingDistributions: boolean = false;
  
    deletingDistributions: { [key: string]: boolean } = {};
  
    isEditing: boolean = false;
  
    public map: L.Map;
  
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
          private datasourceService: DatasourceService,
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
  
    //open street map tiles
    osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        "&copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> | &copy; <a href='https://www.flaticon.com/authors/smashingstocks'>smashingstocks - Flaticon</a>",
    });
  
    // Add this method to handle stepper step changes
    onStepChange(stepperIndex: number): void {
      // Check if we're leaving step 2 (index 1) and clean up the map
      if (this.selectedStepIndex === 1 && stepperIndex !== 1) {
        this.cleanupMap();
      }    
  
      this.selectedStepIndex = stepperIndex;
      
      // Call initMap specifically when we reach step 2 (index 1)
      if (this.selectedStepIndex === 1) {
        // Use setTimeout to ensure the DOM is ready with the map element
        setTimeout(() => {
          this.initMap();
        });
      }
    }
  
    // Method to properly clean up the map
    private cleanupMap(): void {
      if (this.map) {
        this.map.remove();
        this.map = null;
      }
    }
  
    // Update initMap to handle null spatial data
    private initMap(): void {
  
      // Fix marker icon issue by setting the default icon using CDN URLs
      const iconDefault = L.icon({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        tooltipAnchor: [16, -28],
        shadowSize: [41, 41]
      });
      
      // Assign the default icon to L.Marker.prototype
      L.Marker.prototype.options.icon = iconDefault;
  
      const mapElement = document.getElementById('map');
      if (!mapElement) {
        console.log('Map element not found. Cannot initialize map.');
        return;
      }
      
      // Initialize the map with OpenStreetMap tiles
      this.map = L.map("map", {
        center: [52, 12],
        zoom: 3,
        layers: [this.osm],
      });
  
      //Open the map dialog when clicking on the map
      this.map.on('click', () => {
        this.openMapDialog();
      });
  
      // Create a FeatureGroup to hold the spatial entity
      const geometry = new L.FeatureGroup();
      
      // Check if we have spatial data in localStorage
      const storedDataset = localStorage.getItem('dataset_to_edit');
      if (storedDataset !== null) {
        const parsedData = JSON.parse(storedDataset);
        let spatial = parsedData.spatial;
        
        // Only add to map if spatial data exists
        if (spatial) {
          // Handle different geometry types
          if (spatial.type === 'Point') {
            // Create a marker for Point geometry
            const [longitude, latitude] = spatial.coordinates;
            L.marker([latitude, longitude])
              .bindPopup(`Point: [${latitude}, ${longitude}]`)
              .addTo(geometry);
          } 
          else if (spatial.type === 'LineString') {
            // Create a polyline for LineString geometry
            const latLngs = spatial.coordinates.map(coord => [coord[1], coord[0]]);
            L.polyline(latLngs, { color: 'blue' })
              .bindPopup('LineString')
              .addTo(geometry);
          }
          else if (spatial.type === 'Polygon') {
            // Create a polygon for Polygon geometry
            const latLngs = spatial.coordinates[0].map(coord => [coord[1], coord[0]]);
            L.polygon(latLngs, { color: 'green' })
              .bindPopup('Polygon')
              .addTo(geometry);
          }
          
          // Add the FeatureGroup to the map
          geometry.addTo(this.map);
          
          // Fit the map to the bounds of the geometry
          if (geometry.getLayers().length > 0) {
            this.map.fitBounds(geometry.getBounds(), {
              padding: [50, 50],
              maxZoom: 5
            });
          }
        }
      }
    }
  
    // Initialize forms
    initForms(): void {
      // Add validator to distribution form
      this.distributionForm = this.fb.group({
        id: ['', [this.forbiddenCharsValidator()]],  // Apply validator
        title: ['', Validators.required],
        format: [''],
        otherFormat: ['', [
          Validators.maxLength(10), 
          this.notEqualToOtherValidator()
        ]],
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

    // Monitor format changes to toggle otherFormat field
    this.distributionForm.get('format').valueChanges.subscribe(format => {
      this.isOtherFormatSelected = format === 'Other';
      
      const otherFormatControl = this.distributionForm.get('otherFormat');
      if (this.isOtherFormatSelected) {
        otherFormatControl.enable();
        otherFormatControl.setValidators([
          Validators.maxLength(20),
          this.notEqualToOtherValidator()
        ]);
      } else {
        otherFormatControl.disable();
        otherFormatControl.setValidators(null);
      }
      otherFormatControl.updateValueAndValidity();
    });
  
   
  
      // Add validator to dataset form with today's date as default for new datasets
      this.datasetForm = this.fb.group({
        id: ['', [this.forbiddenCharsValidator()]],  // Apply validator
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

  // Validator to ensure otherFormat isn't 'Other' (case insensitive)
  notEqualToOtherValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      // Check if the value equals "Other" (case-insensitive and ignoring spaces)
      const normalized = control.value.replace(/\s+/g, '').toLowerCase();
      return normalized === 'other' ? { equalToOther: true } : null;
    };
  }
  

    // Add this method to edit a distribution
    editDistribution(distribution: any): void {
      this.isEditingDistribution = true;
      this.currentEditingDistributionId = distribution.id;
      
      // Reset and populate the form with existing distribution data
      this.distributionForm.reset();

      // Check if this distribution has a format value
      let format = null;
      let otherFormat = '';
      
      // Only process format if it exists and isn't empty
      if (distribution.format && distribution.format.trim() !== '') {
        // If format doesn't match any standard option (case insensitive and ignore spaces)
        const normalizedFormat = distribution.format.replace(/\s+/g, '').toLowerCase();
        const isStandardFormat = this.formatOptions.some(opt => 
          opt.replace(/\s+/g, '').toLowerCase() === normalizedFormat
        );
        
        if (isStandardFormat) {
          // Find the correctly cased format option
          format = this.formatOptions.find(opt => 
            opt.replace(/\s+/g, '').toLowerCase() === normalizedFormat
          );
        } else {
          // It's a custom format
          otherFormat = distribution.format;
          format = 'Other';
        }
      }
      

      
      // Convert arrays to single values for form fields
      const accessUrl = Array.isArray(distribution.accessUrl) && distribution.accessUrl.length > 0 
        ? distribution.accessUrl[0] 
        : '';
      
      // Convert string dates to Date objects for the datepicker
          let releaseDate = new Date();
          let modifiedDate = new Date();
          
         if (distribution.releaseDate) {
            
            // Check if date is in JSON-LD format with @value property
            if (typeof distribution.releaseDate === 'object' && distribution.releaseDate['@value']) {
              // Extract the date string from @value
              const dateString = distribution.releaseDate['@value'];
              
              // Parse the extracted date string
              const momentDate = moment(dateString);
              if (momentDate.isValid()) {
                releaseDate = momentDate.toDate();
              }
            } else {
              // Process as regular string format (existing code)
              const momentDate = moment(distribution.releaseDate);
              
              if (momentDate.isValid()) {
                releaseDate = momentDate.toDate();
              } else {
                // Try alternative format parsing
                const formats = ['YYYY-MM-DD', 'YYYY/MM/DD', 'DD-MM-YYYY', 'MM/DD/YYYY', 'YYYY-MM-DDTHH:mm:ss.SSSZ'];
                
                for (const format of formats) {
                  const parsedDate = moment(distribution.releaseDate, format, true);
                  if (parsedDate.isValid()) {
                    releaseDate = parsedDate.toDate();
                    break;
                  }
                }
                
                // If still not valid, log warning but keep original string for debugging
                if (!moment(releaseDate).isValid()) {
                  console.warn('Could not parse date:', distribution.releaseDate);
                  // Keep today's date as fallback
                }
              }
            }
          }
          
          
          if (distribution.modifiedDate) {
            // Check if date is in JSON-LD format with @value property
            if (typeof distribution.modifiedDate === 'object' && distribution.modifiedDate['@value']) {
              // Extract the date string from @value
              const dateString = distribution.modifiedDate['@value'];
      
              // Parse the extracted date string
              const momentDate = moment(dateString);
              if (momentDate.isValid()) {
                modifiedDate = momentDate.toDate();
              }
            } else {
              // Process as regular string format (existing code)
              const momentDate = moment(distribution.modifiedDate);
      
              if (momentDate.isValid()) {
                modifiedDate = momentDate.toDate();
              } else {
                // Try alternative format parsing
                const formats = ['YYYY-MM-DD', 'YYYY/MM/DD', 'DD-MM-YYYY', 'MM/DD/YYYY', 'YYYY-MM-DDTHH:mm:ss.SSSZ'];
      
                for (const format of formats) {
                  const parsedDate = moment(distribution.modifiedDate, format, true);
                  if (parsedDate.isValid()) {
                    modifiedDate = parsedDate.toDate();
                    break;
                  }
                }
      
                // If still not valid, log warning but keep original string for debugging
                if (!moment(modifiedDate).isValid()) {
                  console.warn('Could not parse date:', distribution.modifiedDate);
                  // Keep today's date as fallback
                }
              }
            }
          }
      
      // Populate the form with existing data
      this.distributionForm.patchValue({
        id: distribution.id,
        title: distribution.title,
        description: distribution.description,
        accessUrl: accessUrl,
        downloadURL: distribution.downloadURL,
        format: format,
        otherFormat: otherFormat,
        byteSize: distribution.byteSize,
        checksum: distribution.checksum,
        rights: distribution.rights,
        mediaType: distribution.mediaType,
        license: distribution.license,
        releaseDate: releaseDate,
        modifiedDate: modifiedDate
      });
      
      // Only disable the ID field if this is a server-persisted distribution (not local-only)
      // Distributions created via API won't have isNew flag, those only in localStorage will
      if (!distribution.isNew) {
        this.distributionForm.get('id').disable();
      } else {
        // For local-only distributions, enable the ID field
        this.distributionForm.get('id').enable();
      }
      
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
  
    private forbiddenCharsValidator(): ValidatorFn {
      return (control: AbstractControl): ValidationErrors | null => {
        if (!control.value) {
          return null; // Skip validation for empty values
        }
        
        // Check for forbidden characters: colon, slash, semicolon, and spaces
        const forbidden = /[:\/;, ]/;
        const isInvalid = forbidden.test(control.value);
        
        return isInvalid ? { forbiddenChars: { value: control.value } } : null;
      };
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

    // Specific format handling logic to handle empty values and optional otherFormat
    let actualFormat = '';
    if (formData.format) {
      if (formData.format === 'Other') {
        // Use otherFormat if provided, otherwise empty string
        actualFormat = formData.otherFormat || '';
      } else {
        actualFormat = formData.format;
      }
    }
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
  
      // Use the ID provided by the user or pass null
      const distributionId = formData.id || createUniqueId();
  
      // Find the existing distribution if we're editing
      let existingDistribution = null;
      if (this.isEditingDistribution) {
        existingDistribution = this.distributions.find(d => d.id === this.currentEditingDistributionId);
      }
  
      // Format the distribution object according to API requirements
      const distribution = {
        // Use the ID from the form if provided, otherwise generate a new one
        // For editing, keep the original ID unless a new one is provided
        id: this.isEditingDistribution 
          ? (existingDistribution?.isNew && formData.id ? formData.id : this.currentEditingDistributionId)
          : distributionId,
        title: formData.title,
        description: formData.description || '',
        accessUrl: formData.accessUrl ? [formData.accessUrl] : [''],
        downloadURL: formData.downloadURL,
        format: actualFormat || '',
        byteSize: formData.byteSize || 0,
        checksum: formData.checksum || '',
        rights: formData.rights || '',
        mediaType: formData.mediaType || '',

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
      
  
      function createUniqueId() {
        return `${formData.title.replace(/\s+/g, '')}${moment(Date.now()).format().replace(/[-:+]/g, '')}`;
      }
    
  
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
          this.translation.instant('TOAST_DISTRIBUTION_ADDED'),
          this.translation.instant('TOAST_DISTRIBUTION_ADDED_TITLE')
        );
      }
      
      // Reset form and editing state
      this.distributionForm.reset({
        format: null,
      });
      this.isEditingDistribution = false;
      this.currentEditingDistributionId = null;
      this.distributionForm.get('id').enable();
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
      
      // Get the dataset ID value, accounting for disabled form controls
      const datasetId = this.datasetForm.get('id').value;
  
      // Check if ID exists and is not empty
      if (!this.isEditing && datasetId && datasetId.trim() !== '') {
        // First check if dataset with this ID already exists using getSingleEntity
        this.isCreatingDataset = true;

        this.datasourceService.getSingleEntity(datasetId).subscribe({
          next: (existingDataset) => {
            // Dataset with this ID already exists
            this.isCreatingDataset = false;
            this.toastrService.danger(
              this.translation.instant('TOAST_DUPLICATE_DATASET_ID', {id: datasetId}),
              this.translation.instant('TOAST_DUPLICATE_DATASET_ID_TITLE')
            );
          },
          error: (error) => {
            // 404 error means dataset doesn't exist, which is good - continue with creation
            if (error.status === 404) {
              this.proceedWithDatasetCreation();
            } else {
              // Other error occurred during the check
              this.isCreatingDataset = false;
              console.error('Error checking dataset existence:', error);
              this.toastrService.danger(
                'A dataset with this ID already exists. Please change the ID.',
                'Error'
              );
            }
          }
        });
      } else {
        // No ID provided or we're in edit mode, proceed normally
        this.proceedWithDatasetCreation();
      }
    }
  
    private proceedWithDatasetCreation(): void {
      // Count active distributions (not marked for deletion)
      const activeDistributionsCount = this.distributions.filter(d => !d.markedForDeletion).length;
      
      if (activeDistributionsCount === 0) {
        // Show a dialog instead of just a toastr message
        this.dialogService.open(ConfirmationDialogComponent, {
          context: {
            title: this.translation.instant('DIALOG_CANNOT_PROCEED'),
            message: this.translation.instant('DIALOG_NO_ACTIVE_DISTRIBUTIONS'),
            confirmButtonText: this.translation.instant('DIALOG_OK'),
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
      
      this.datasourceService.deleteDistribution(distributionId).subscribe({
        next: () => {
          // Process next deletion
          this.processDistributionDeletions(index + 1, onComplete);
        },
        error: (error) => {
          console.error(`Error deleting distribution ${distributionId}:`, error);
          this.isCreatingDataset = false;
          this.toastrService.danger(
            this.translation.instant('TOAST_DELETE_DISTRIBUTION_FAILED'),
            this.translation.instant('TOAST_DISTRIBUTION_DELETION_ERROR')
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
        ? this.datasourceService.createDistribution(distToSend)
        : this.datasourceService.updateDistribution(distribution.id, distToSend);
      
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
              this.translation.instant('TOAST_DUPLICATE_DISTRIBUTION', {title: distribution.title}),
              this.translation.instant('TOAST_DUPLICATE_DISTRIBUTION_TITLE')
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
      
      // Get spatial data from localStorage, but don't require it
      const storedDataset = localStorage.getItem('dataset_to_edit');
      let spatialData = null;
      
      if (storedDataset) {
        const parsedStoredDataset = JSON.parse(storedDataset);
        // Check if spatial data exists and is not empty
        if (parsedStoredDataset.spatial && parsedStoredDataset.spatial !== null) {
          // Make sure that spatialData is always an array if it exists
          spatialData = [parsedStoredDataset.spatial];
        };
      }
      
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
        spatial: spatialData, // This can now be null
        contactPoint: this.contactPointArray.length === 0 ? [""] : this.contactPointArray,
        keyword: this.keywordArray.length === 0 ? [""] : this.keywordArray,
        theme: themeValue,
        frequency: frequencyValue,
        accessRights: 'public'
      };
      
      // If ID is empty or just whitespace, remove it from the payload and let backend generate it
      if (!formValue.id || formValue.id.trim() === '') {
        delete dataset.id;
      }
      
      // Remove ID from the payload when updating
      const datasetId = formValue.id;
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

        operation = this.datasourceService.updateDataset(datasetId, dataset);
      } else {
        operation = this.datasourceService.createDataset(dataset);
      }
      
      operation.subscribe({
        next: () => {
          // Clear localStorage
          localStorage.removeItem('dataset_to_edit');
          // Reset form and navigate back
          this.datasetForm.reset();
          this.distributions = [];
          this.isCreatingDataset = false;
          this.router.navigate(['/pages/data-sources'], 
            {
            queryParamsHandling: 'merge',
            });
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
      this.distributionForm.reset({
        format: 'CSV',
        otherFormat: ''
      });
      this.isEditingDistribution = false;
      this.currentEditingDistributionId = null;
      this.distributionForm.get('id').enable();
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
              this.translation.instant('TOAST_DISTRIBUTION_REMOVED', {title: distributionToDelete.title}),
              this.translation.instant('TOAST_DISTRIBUTION_REMOVED_TITLE')
            );
          } else {
            // Mark existing distribution for deletion
            distributionToDelete.markedForDeletion = true;
            
            // Add to array of distributions to delete
            if (!this.distributionsToDelete.includes(distributionToDelete.id)) {
              this.distributionsToDelete.push(distributionToDelete.id);
            }
            
            this.toastrService.info(
              this.translation.instant('TOAST_DISTRIBUTION_MARKED_DELETION', {title: distributionToDelete.title}),
              this.translation.instant('TOAST_DISTRIBUTION_MARKED_DELETION_TITLE')
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
          this.translation.instant('TOAST_DISTRIBUTION_RESTORED', {title: distribution.title}),
          this.translation.instant('TOAST_DISTRIBUTION_RESTORED_TITLE')
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
            this.translation.instant('TOAST_DISTRIBUTION_REMOVED', {title: distributionToRemove.title}),
            this.translation.instant('TOAST_DISTRIBUTION_REMOVED_TITLE')
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

      this.datasourceService.getDistributions().subscribe({
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
  
        // Disable the ID field when editing
      if (this.isEditing) {
        this.datasetForm.get('id').disable();
      }
      
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
  
    // Open map dialog when clicking on the map
    openMapDialog() {
      // Store the current scroll position
      const scrollPosition = window.scrollY || document.documentElement.scrollTop;
      
      // Hide the background map completely
      const mapElement = document.getElementById('map');
      if (mapElement) {
        mapElement.classList.add('map-hidden');
      }
      
      this.dialogService.open(MapDialogComponent, {
        hasBackdrop: true,
        closeOnBackdropClick: true,
        closeOnEsc: true,
        dialogClass: 'map-dialog-fixed',
        hasScroll: false
      })
      .onClose.subscribe(newSpatial => {
        // Show the map again
        if (mapElement) {
          mapElement.classList.remove('map-hidden');
        }
        
        // Restore scroll position
        setTimeout(() => {
          window.scrollTo(0, scrollPosition);
        }, 0);
        
        // Handle result
        if (newSpatial) {
          // Clean up and reinitialize the map
        this.cleanupMap();
        setTimeout(() => {
          this.initMap();
        }, 100);
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
      this.datasourceService.getDistributions().subscribe({
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
      this.datasourceService.getDatasets().subscribe({
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
            this.translation.instant('TOAST_CONTACT_POINT_EXISTS', {value: value}),
            this.translation.instant('TOAST_DUPLICATE_CONTACT_POINT')
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
  
    /**
     * Reset spatial data and clear map markers
     */
    resetSpatial(): void {
      // Show confirmation dialog
      this.dialogService.open(ConfirmationDialogComponent, {
        context: {
          title: 'Reset Spatial Data',
          message: 'Are you sure you want to clear the spatial data? This will remove the location from the map.',
        },
      }).onClose.subscribe(confirmed => {
        if (confirmed) {
          
          // Clear the map by removing all layers
          if (this.map) {
            this.map.eachLayer(layer => {
              if (layer instanceof L.Marker || layer instanceof L.Polygon || layer instanceof L.Polyline) {
                this.map.removeLayer(layer);
              }
            });
          //recenter the map to the default position
          this.map.setView([47, 6], 3); // Adjust the coordinates and zoom level as needed
          }
  
          const storedDataset = localStorage.getItem('dataset_to_edit');
            if (storedDataset) {
              const parsedDataset = JSON.parse(storedDataset);
              parsedDataset.spatial = null;
              localStorage.setItem('dataset_to_edit', JSON.stringify(parsedDataset));
            }
          
          this.toastrService.success(
            this.translation.instant('TOAST_SPATIAL_CLEARED'),
            this.translation.instant('TOAST_SUCCESS')
          );
        }
      });
    }
}
