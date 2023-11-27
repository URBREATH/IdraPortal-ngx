import { TestBed } from '@angular/core/testing';

import { CataloguesServiceService } from './catalogues-service.service';

describe('CataloguesServiceService', () => {
  let service: CataloguesServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CataloguesServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
