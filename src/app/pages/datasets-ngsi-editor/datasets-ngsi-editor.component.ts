import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { NgsiDatasetsService } from '../services/ngsi-datasets.service';
import { Router } from '@angular/router';
import moment from 'moment';
import { NbDialogService } from '@nebular/theme';
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-datasets-ngsi-editor',
  templateUrl: './datasets-ngsi-editor.component.html',
  styleUrls: ['./datasets-ngsi-editor.component.scss']
})
export class DatasetsNgsiEditorComponent implements OnInit {

  // Add this property to your component
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

  // Add the isEditing property
  isEditing: boolean = false;

  constructor(
        private fb: FormBuilder,
        private ngsiDatasetsService: NgsiDatasetsService,
        private router: Router,
        private dialogService: NbDialogService 
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

    // Add initial spatial point
    this.addSpatialPoint();
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

  createSpatialPoint() {
    return this.fb.group({
      type: ['Point'],
      coordinates: this.fb.array([
        this.fb.control(this.getRandomCoordinate(0, 180)), // longitude
        this.fb.control(this.getRandomCoordinate(-90, 90)) // latitude
      ])
    });
  }

  // Helper to generate realistic coordinates
  getRandomCoordinate(min: number, max: number): number {
    return parseFloat((Math.random() * (max - min) + min).toFixed(6));
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

  addSpatialPoint() {
    this.spatialPoints.push(this.createSpatialPoint());
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

  createDistribution(): void {
    // Mark all fields as touched to trigger validation display
    this.markFormGroupTouched(this.distributionForm);
    
    if (this.distributionForm.invalid) {
      console.error('Form is invalid. Please fill in required fields.');
      return;
    }

    const formData = this.distributionForm.value;

    // Format the distribution object according to API requirements
    const distribution = {
      id: formData.id || this.generateDistributionId(),
      title: formData.title,
      description: formData.description || 'Distribution description',
      accessUrl: [formData.accessUrl || ''],
      downloadURL: formData.downloadURL || `urn:ngsi-ld:DistributionDCAT-AP:items:${this.generateRandomId()}`,
      format: formData.format || 'CSV',
      byteSize: formData.byteSize || Math.floor(Math.random() * 100000),
      checksum: formData.checksum || this.generateRandomChecksum(),
      rights: formData.rights || 'copyleft',
      mediaType: formData.mediaType || '',
      license: formData.license || 'CC-BY',
      releaseDate: formData.releaseDate ? 
        moment(formData.releaseDate).format() : // Use moment format instead of toISOString
        moment().format(),
      modifiedDate: formData.modifiedDate ? 
        moment(formData.modifiedDate).format() : // Use moment format instead of toISOString
        moment().format()
    };

    this.ngsiDatasetsService.createDistribution(distribution).subscribe({
      next: (response) => {
        console.log('Distribution created successfully:', response);
        
        // Add the created distribution to local array
        this.distributions.push(distribution);
        
        // Reset the form
        this.distributionForm.reset({
          format: 'CSV',
          license: 'CC-BY',
          rights: 'copyleft'
        });
      },
      error: (error) => {
        console.error('Error creating distribution:', error);
      }
    });
  }

  generateDistributionId(): string {
    // Simple ID generator
    const prefix = 'DIST';
    const randomNum = Math.floor(Math.random() * 100000000);
    return `${prefix}:${randomNum}`;
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
            // You can also use a toast service here instead of alert
            alert(`Failed to delete distribution: ${error.message || 'Unknown error'}`);
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

  onCreateDataset(): void {
    const formValue = this.datasetForm.getRawValue();
    
    // Get distribution IDs for the datasetDistribution field - only include checked distributions
    const datasetDistribution = this.distributions
      .filter(dist => this.selectedDistributions[dist.id])
      .map(dist => dist.id);

    // Format date with time component using Moment.js
    const releaseDate = formValue.releaseDate ? 
      moment(formValue.releaseDate).format() : // ISO 8601 format
      moment().format();

    // Create the dataset object
    let dataset = {
      ...formValue,
      releaseDate,
      datasetDistribution,
      // Ensure these are arrays even if empty
      datasetDescription: formValue.datasetDescription || [],
      theme: formValue.theme || [],
      contactPoint: formValue.contactPoint || [],
      keyword: formValue.keyword || [],
      versionNotes: formValue.versionNotes || [],
      // Ensure spatial has proper coordinates
      spatial: formValue.spatial?.length > 0 ? formValue.spatial : [{
        type: "Point",
        coordinates: [
          parseFloat((Math.random() * 180).toFixed(6)),
          parseFloat((Math.random() * 90).toFixed(6))
        ]
      }]
    };
    
    // Remove ID from the payload when updating
    const datasetId = formValue.id;
    console.log('DATASET ID:' + datasetId);
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
              // Check if distribution ID matches any ID in distributionIds, ignoring the prefix
              const isSelected = distributionIds.some(datasetId => {
                // Convert both to strings for consistency
                const dsId = String(datasetId);
                const distId = String(dist.id);
                
                // Direct match
                if (dsId === distId) return true;
                
                // Handle the case when dataset ID has the prefix added
                if (dsId.includes('urn:ngsi-ld:Dataset:items:')) {
                  const normalizedId = dsId.replace('urn:ngsi-ld:Dataset:items:', '');
                  return normalizedId === distId;
                }
                
                return false;
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
    
    // Handle spatial data
    if (dataset.spatial && dataset.spatial.length > 0) {
      dataset.spatial.forEach((point: any) => {
        const pointGroup = this.fb.group({
          type: [point.type || 'Point'],
          coordinates: this.fb.array([
            this.fb.control(point.coordinates[0]),
            this.fb.control(point.coordinates[1])
          ])
        });
        this.spatialPoints.push(pointGroup);
      });
    } else {
      this.addSpatialPoint();
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

  private generateRandomId(): string {
    return `${Math.floor(Math.random() * 10000)}:${Math.floor(Math.random() * 100000000)}`;
  }

  private generateRandomChecksum(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result + '.';
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
}
