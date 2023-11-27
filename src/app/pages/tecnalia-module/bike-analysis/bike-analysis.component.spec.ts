import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BikeAnalysisComponent } from './bike-analysis.component';

describe('BikeAnalysisComponent', () => {
  let component: BikeAnalysisComponent;
  let fixture: ComponentFixture<BikeAnalysisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BikeAnalysisComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BikeAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
