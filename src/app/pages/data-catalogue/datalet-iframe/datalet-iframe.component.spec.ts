import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataletIframeComponent } from './datalet-iframe.component';

describe('DataletIframeComponent', () => {
  let component: DataletIframeComponent;
  let fixture: ComponentFixture<DataletIframeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DataletIframeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DataletIframeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
