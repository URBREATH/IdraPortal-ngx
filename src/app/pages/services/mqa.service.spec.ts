import { TestBed } from '@angular/core/testing';

import { MqaService } from './mqa.service';

describe('MqaService', () => {
  let service: MqaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MqaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
