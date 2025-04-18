import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { NgsiDatasetsService } from '../services/ngsi-datasets.service';
import { Router } from '@angular/router';
import moment from 'moment';
import { NbDialogService, NbToastrService } from '@nebular/theme';
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog.component';
import * as L from 'leaflet';
import { MapDialogComponent } from '../../shared/map-dialog/map-dialog.component';

@Component({
  selector: 'app-datasets-ngsi-editor',
  templateUrl: './datasets-ngsi-editor.component.html',
  styleUrls: ['./datasets-ngsi-editor.component.scss']
})
export class DatasetsNgsiEditorComponent implements OnInit {

  formatOptions: string[] = [
    'JSON',
    'CSV',
    'XML',
    'TXT'
  ];

  selectedStepIndex = 0;
  
  distributionForm: FormGroup;
  distributions: any[] = [];
  
  datasetForm: FormGroup;
  
  loadingDistributions: boolean = false;

  deletingDistributions: { [key: string]: boolean } = {};

  selectedDistributions: {[id: string]: boolean} = {};

  isEditing: boolean = false;

  public map: L.Map;

  isEditingDistribution: boolean = false;
  currentEditingDistributionId: string = null;

  constructor(
        private fb: FormBuilder,
        private ngsiDatasetsService: NgsiDatasetsService,
        private router: Router,
        private dialogService: NbDialogService,
        private toastrService: NbToastrService 
  ) { }

  ngOnInit(): void {
    // Initialize form
    this.initForms();
    
    // Check if we're editing an existing dataset
    const storedDataset = localStorage.getItem('dataset_to_edit');
    if (storedDataset) {
      try {
        const parsedDataset = JSON.parse(storedDataset);
        this.isEditing = true; // Set editing flag to true
        console.log('Editing existing dataset:', parsedDataset.id);
        
        // Populate the form with existing data
        this.populateDatasetForm(parsedDataset);
        
        // Load distributions and select those associated with this dataset
        this.loadDistributions(parsedDataset);
      } catch (error) {
        console.error('Error parsing dataset from localStorage:', error);
        this.isEditing = false;
        this.loadDistributions();
      }
    } else {
      this.isEditing = false;
      this.loadDistributions();
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
      console.log('Cleaning up map resources');
      this.map.remove();
      this.map = null;
    }
  }

  // Update initMap to remove the redundant check since we'll only call it at the right time
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
        let spatial = JSON.parse(storedDataset).spatial;
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
              // Convert from GeoJSON [lng, lat] to Leaflet [lat, lng] format
              const latLngs = spatial.coordinates.map(coord => [coord[1], coord[0]]);
              L.polyline(latLngs, { color: 'blue' })
                .bindPopup('LineString')
                .addTo(geometry);
            }
            else if (spatial.type === 'Polygon') {
              // Create a polygon for Polygon geometry
              // For polygons, coordinates are nested arrays where the first array contains the outer ring
              const latLngs = spatial.coordinates[0].map(coord => [coord[1], coord[0]]);
              L.polygon(latLngs, { color: 'green' })
                .bindPopup('Polygon')
                .addTo(geometry);
            }
        
        // Add the FeatureGroup to the map
        geometry.addTo(this.map);
        
         // Fit the map to the bounds of the geometry
         this.map.fitBounds(geometry.getBounds(), {
          padding: [50, 50],
          maxZoom: 5
        });
      }
  }

  // Initialize forms
  initForms(): void {
    // Initialize distribution form
    this.distributionForm = this.fb.group({
      id: [''],
      title: ['', Validators.required],
      format: ['CSV'],
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

    // Initialize dataset form with arrays for multi-value fields
    this.datasetForm = this.fb.group({
      id: [''],
      title: [''],
      datasetDescription: this.fb.array([this.createDescriptionField()]),
      description: [''],
      name: [''],
      publisher: [''],
      spatial: this.fb.array([]),
      releaseDate: [''],
      theme: this.fb.array([this.createThemeField()]),
      contactPoint: this.fb.array([this.createContactPointField()]),
      creator: [''],
      keyword: this.fb.array([this.createKeywordField()]),
      accessRights: ['non-public'],
      frequency: [''],
      version: [''],
      versionNotes: this.fb.array([this.createVersionNoteField()])
    });

  }

  // Helper methods for form arrays
  createDescriptionField() {
    return this.fb.control('');
  }

  createThemeField() {
    return this.fb.control('');
  }

  createContactPointField() {
    return this.fb.control('');
  }

  createKeywordField() {
    return this.fb.control('');
  }

  createVersionNoteField() {
    return this.fb.control('');
  }

  

  // Form array getters
  get datasetDescriptions() {
    return this.datasetForm.get('datasetDescription') as FormArray;
  }

  get themes() {
    return this.datasetForm.get('theme') as FormArray;
  }

  get contactPoints() {
    return this.datasetForm.get('contactPoint') as FormArray;
  }

  get keywords() {
    return this.datasetForm.get('keyword') as FormArray;
  }

  get versionNotesArray() {
    return this.datasetForm.get('versionNotes') as FormArray;
  }

  get spatialPoints() {
    return this.datasetForm.get('spatial') as FormArray;
  }

  // Methods to add new items to arrays
  addDatasetDescription() {
    this.datasetDescriptions.push(this.createDescriptionField());
  }

  addTheme() {
    this.themes.push(this.createThemeField());
  }

  addContactPoint() {
    this.contactPoints.push(this.createContactPointField());
  }

  addKeyword() {
    this.keywords.push(this.createKeywordField());
  }

  addVersionNote() {
    this.versionNotesArray.push(this.createVersionNoteField());
  }

  // Methods to remove items from arrays
  removeDatasetDescription(index: number) {
    this.datasetDescriptions.removeAt(index);
  }

  removeTheme(index: number) {
    this.themes.removeAt(index);
  }

  removeContactPoint(index: number) {
    this.contactPoints.removeAt(index);
  }

  removeKeyword(index: number) {
    this.keywords.removeAt(index);
  }

  removeVersionNote(index: number) {
    this.versionNotesArray.removeAt(index);
  }

  removeSpatialPoint(index: number) {
    this.spatialPoints.removeAt(index);
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
      id: distribution.id,
      title: distribution.title,
      description: distribution.description,
      accessUrl: accessUrl,
      downloadURL: distribution.downloadURL,
      format: distribution.format,
      byteSize: distribution.byteSize,
      checksum: distribution.checksum,
      rights: distribution.rights,
      mediaType: distribution.mediaType,
      license: distribution.license,
      releaseDate: releaseDate,
      modifiedDate: modifiedDate
    });
    
    // Disable the ID field during editing
    this.distributionForm.get('id').disable();
    
    // Scroll to the form section
    setTimeout(() => {
      const formElement = document.getElementById('distributionForm');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }

  createDistribution(): void {
    // Mark all fields as touched to trigger validation display
    this.markFormGroupTouched(this.distributionForm);
    
    if (this.distributionForm.invalid) {
      this.toastrService.danger(
        'Please fill in all required fields',
        'Form Invalid'
      );
      return;
    }

    const formData = this.distributionForm.value;
    
    if (!this.isEditingDistribution && !formData.id) {
      this.toastrService.danger(
        'Please provide an ID for the distribution',
        'ID Required'
      );
      return;
    }

    // Check if ID contains forbidden strings that could interfere with ID matching
    if (!this.isEditingDistribution && (formData.id.includes(':') || formData.id.includes(':'))) {
      this.toastrService.danger(
        'Distribution ID cannot contain ":" as it is reserved for internal use',
        'Invalid ID Format'
      );
      return;
    }

    // Format the distribution object according to API requirements
    const distribution = {
      id: this.isEditingDistribution ? this.currentEditingDistributionId : formData.id,
      title: formData.title,
      description: formData.description || '',
      accessUrl: formData.accessUrl ? [formData.accessUrl] : [''],
      downloadURL: formData.downloadURL,
      format: formData.format || 'CSV',
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
        moment().format()
    };

    // Choose operation based on editing mode
    if (this.isEditingDistribution) {
      this.ngsiDatasetsService.updateDistribution(this.currentEditingDistributionId, distribution).subscribe({
        next: (response) => {
          console.log('Distribution updated successfully:', response);
          
          // Update the distribution in the local array
          const index = this.distributions.findIndex(d => d.id === this.currentEditingDistributionId);
          if (index !== -1) {
            this.distributions[index] = distribution;
          }
          
          // Reset form and editing state
          this.distributionForm.reset({
            format: 'CSV'
          });
          this.isEditingDistribution = false;
          this.currentEditingDistributionId = null;
          
          // Enable ID field for next use
          this.distributionForm.get('id').enable();
          
          this.toastrService.success(
            'The distribution has been updated successfully',
            'Distribution Updated'
          );
        },
        error: (error) => {
          console.error('Error updating distribution:', error);
          this.toastrService.danger(
            'Failed to update the distribution. Please try again.',
            'Update Failed'
          );
        }
      });
    } else {
      // Original create logic
      this.ngsiDatasetsService.createDistribution(distribution).subscribe({
        next: (response) => {
          console.log('Distribution created successfully:', response);
          
          // Add the created distribution to local array
          this.distributions.push(distribution);
          
          // Reset the form
          this.distributionForm.reset({
            format: 'CSV'
          });
          
          this.toastrService.success(
            'New distribution has been created successfully',
            'Distribution Created'
          );
        },
        error: (error) => {
          console.error('Error creating distribution:', error);
          this.toastrService.danger(
            'Failed to create the distribution. Please try again.',
            'Creation Failed'
          );
        }
      });
    }
  }

  // Cancel editing a distribution
  cancelEditDistribution(): void {
    this.distributionForm.reset({
      format: 'CSV'
    });
    this.isEditingDistribution = false;
    this.currentEditingDistributionId = null;
    this.distributionForm.get('id').enable();
  }

  removeDistribution(index: number): void {
    const distributionToDelete = this.distributions[index];
    
    if (!distributionToDelete || !distributionToDelete.id) {
      console.error('Invalid distribution or missing ID');
      return;
    }
    
    this.dialogService.open(ConfirmationDialogComponent, {
      context: {
        title: 'Delete Distribution',
        message: `Are you sure you want to delete distribution "${distributionToDelete.title}"?`,
      },
    }).onClose.subscribe(confirmed => {
      if (confirmed) {
        // Set loading state for this specific distribution
        this.deletingDistributions[distributionToDelete.id] = true;
        
        this.ngsiDatasetsService.deleteDistribution(distributionToDelete.id).subscribe({
          next: () => {
            console.log(`Distribution ${distributionToDelete.id} deleted successfully`);
            this.distributions.splice(index, 1);
            delete this.deletingDistributions[distributionToDelete.id];
          },
          error: (error) => {
            console.error(`Error deleting distribution ${distributionToDelete.id}:`, error);
            delete this.deletingDistributions[distributionToDelete.id];
            this.toastrService.danger(
              error.message || 'Unknown error occurred',
              'Failed to Delete Distribution'
            );
          }
        });
      }
    });
  }

  onImportDistributions(): void {
    this.loadingDistributions = true;
    
    this.ngsiDatasetsService.getDistributions().subscribe({
      next: (response) => {
        if (response && response.length > 0) {
          // Filter out distributions that are already in the list (avoid duplicates)
          const newDistributions = response.filter(newDist => 
            !this.distributions.some(existingDist => existingDist.id === newDist.id)
          );
          
          // Add the new distributions to the existing array
          if (newDistributions.length > 0) {
            this.distributions = [...this.distributions, ...newDistributions];
            console.log(`Imported ${newDistributions.length} new distributions`);
          } else {
            console.log('No new distributions to import');
          }
        } else {
          console.log('No distributions available to import');
        }
        
        this.loadingDistributions = false;
      },
      error: (error) => {
        console.error('Error loading distributions:', error);
        this.loadingDistributions = false;
      }
    });
  }


  // Method to create or update a dataset
  onCreateDataset(): void {
    const formValue = this.datasetForm.getRawValue();
    
    // Check for mandatory fields
    if (!formValue.title) {
      this.toastrService.danger(
        'Please provide a title for the dataset',
        'Title Required'
      );
      return;
    }

    if (!formValue.releaseDate) {
      this.toastrService.danger(
        'Please specify a release date',
        'Release Date Required'
      );
      return;
    }

    if (!this.isEditing && !formValue.id) {
      this.toastrService.danger(
        'Please provide an ID for the dataset',
        'ID Required'
      );
      return;
    }
    
    // Check for spatial data in localStorage
    const storedDataset = localStorage.getItem('dataset_to_edit');
    let spatialData: [Object];
    
    if (storedDataset) {
      const parsedStoredDataset = JSON.parse(storedDataset);
      //Make sure that spatialData is always an array
      spatialData = [parsedStoredDataset.spatial];
    }
    
    if (!spatialData) {
      this.toastrService.danger(
        'Please add a location on the map',
        'Spatial Data Required'
      );
      return;
    }

    // Get distribution IDs for the datasetDistribution field
    const datasetDistribution = this.distributions
      .filter(dist => this.selectedDistributions[dist.id])
      .map(dist => dist.id);

    // Format date with time component using Moment.js
    const releaseDate = formValue.releaseDate ? 
      moment(formValue.releaseDate).format() : 
      null;

    // Create the dataset object with only user-provided data
    let dataset = {
      ...formValue,
      releaseDate,
      datasetDistribution,
      spatial: spatialData
    };
    
    // Remove ID from the payload when updating
    const datasetId = formValue.id;
    if (this.isEditing) {
      const { id, ...datasetWithoutId } = dataset;
      dataset = datasetWithoutId;
    }
    
    console.log(`${this.isEditing ? 'Updating' : 'Creating'} dataset with data:`, JSON.stringify(dataset));
    
    // Choose between create or update
    let operation;
    if (this.isEditing) {
      operation = this.ngsiDatasetsService.updateDataset(datasetId, dataset);
    } else {
      operation = this.ngsiDatasetsService.createDataset(dataset);
    }
    
    operation.subscribe({
      next: (response) => {
        console.log(`Dataset ${this.isEditing ? 'updated' : 'created'} successfully:`, response);
        // Clear localStorage
        localStorage.removeItem('dataset_to_edit');
        // Reset form and navigate back
        this.datasetForm.reset();
        this.distributions = [];
        this.selectedDistributions = {};
        this.router.navigate(['/pages/datasets-ngsi']);
      },
      error: (error) => {
        console.error(`Error ${this.isEditing ? 'updating' : 'creating'} dataset:`, error);
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
          
          // Clear all selections first
          this.selectedDistributions = {};
          
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
            
            // Debug logging to check what's happening
            console.log('Dataset distribution IDs (processed):', distributionIds);
            console.log('Available distributions:', this.distributions.map(d => d.id));
            
            // Now safely use forEach on the distributions
            this.distributions.forEach(dist => {
              // Check if distribution ID matches any ID in distributionIds by extracting the identifier part
              const isSelected = distributionIds.some(datasetId => {
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
              
              this.selectedDistributions[dist.id] = isSelected;
              
              if (isSelected) {
                console.log(`Selected distribution: ${dist.id} - ${dist.title}`);
              }
            });
            
            console.log(`Loaded ${this.distributions.length} distributions, selected ${distributionIds.length}`);
          } else {
            // For new datasets, select all by default
            response.forEach(dist => {
              this.selectedDistributions[dist.id] = true;
            });
            console.log(`Loaded ${this.distributions.length} distributions, selected all`);
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
    console.log('Populating form with dataset:', dataset);
    
    // Clear existing form arrays
    while (this.datasetDescriptions.length > 0) {
      this.datasetDescriptions.removeAt(0);
    }
    while (this.themes.length > 0) {
      this.themes.removeAt(0);
    }
    while (this.contactPoints.length > 0) {
      this.contactPoints.removeAt(0);
    }
    while (this.keywords.length > 0) {
      this.keywords.removeAt(0);
    }
    while (this.versionNotesArray.length > 0) {
      this.versionNotesArray.removeAt(0);
    }
    while (this.spatialPoints.length > 0) {
      this.spatialPoints.removeAt(0);
    }
    
    // Parse the date properly using Moment.js
    let releaseDate = null;
    if (dataset.releaseDate) {
      const momentDate = moment(dataset.releaseDate);
      if (momentDate.isValid()) {
        releaseDate = momentDate.toDate(); // Convert to Date object for Angular datepicker
      } else {
        console.warn('Invalid date format from server:', dataset.releaseDate);
        releaseDate = null;
      }
    }
    
    // Set simple fields
    this.datasetForm.patchValue({
      id: dataset.id || '',
      title: dataset.title || '',
      description: dataset.description || '',
      name: dataset.name || '',
      publisher: dataset.publisher || '',
      releaseDate: releaseDate, // Use our properly parsed date
      creator: dataset.creator || '',
      accessRights: dataset.accessRights || 'non-public',
      frequency: dataset.frequency || '',
      version: dataset.version || ''
    });

      // Disable the ID field when editing
    if (this.isEditing) {
      this.datasetForm.get('id').disable();
    }
    
    // Set array fields
    if (dataset.datasetDescription && dataset.datasetDescription.length > 0) {
      dataset.datasetDescription.forEach((desc: string) => {
        this.datasetDescriptions.push(this.fb.control(desc));
      });
    } else {
      this.addDatasetDescription();
    }
    
    if (dataset.theme && dataset.theme.length > 0) {
      dataset.theme.forEach((theme: string) => {
        this.themes.push(this.fb.control(theme));
      });
    } else {
      this.addTheme();
    }
    
    if (dataset.contactPoint && dataset.contactPoint.length > 0) {
      dataset.contactPoint.forEach((contact: string) => {
        this.contactPoints.push(this.fb.control(contact));
      });
    } else {
      this.addContactPoint();
    }
    
    if (dataset.keyword && dataset.keyword.length > 0) {
      dataset.keyword.forEach((keyword: string) => {
        this.keywords.push(this.fb.control(keyword));
      });
    } else {
      this.addKeyword();
    }
    
    if (dataset.versionNotes && dataset.versionNotes.length > 0) {
      dataset.versionNotes.forEach((note: string) => {
        this.versionNotesArray.push(this.fb.control(note));
      });
    } else {
      this.addVersionNote();
    }
    
  }

  // Check if all distributions are selected
  areAllDistributionsSelected(): boolean {
    return this.distributions.length > 0 && 
           this.distributions.every(dist => this.selectedDistributions[dist.id]);
  }

  // Toggle selection for all distributions
  toggleAllDistributions(checked: boolean): void {
    if (checked) {
      this.distributions.forEach(dist => {
        this.selectedDistributions[dist.id] = true;
      });
    } else {
      this.selectedDistributions = {};
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
}
