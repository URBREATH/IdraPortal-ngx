import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ODMSCatalogue } from '../data-catalogue/model/odmscatalogue';
import { ODMSCatalogueComplete } from '../data-catalogue/model/odmscataloguecomplete';

@Injectable({
  providedIn: 'root'
})
export class SharedService {

  constructor() { }

  // private addCatalogueIsLoaded = new BehaviorSubject<boolean>(false);
  // addCatalogueIsLoaded$ = this.addCatalogueIsLoaded.asObservable();
 
 
  // propagateCatalogueIsLoaded(newVal: boolean) {
  //   this.addCatalogueIsLoaded.next(newVal)
  // }
}
