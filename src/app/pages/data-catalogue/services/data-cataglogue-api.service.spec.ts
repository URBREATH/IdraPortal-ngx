import { TestBed } from '@angular/core/testing';

import { DataCataglogueAPIService } from './data-cataglogue-api.service';

describe('DataCataglogueAPIService', () => {
  let service: DataCataglogueAPIService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataCataglogueAPIService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
