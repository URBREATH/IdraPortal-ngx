import { ComponentFixture, TestBed } from '@angular/core/testing';
import * as L from 'leaflet';
import { TrafficPredictionComponent } from './traffic-prediction.component';

describe('TrafficPredictionComponent', () => {
  let component: TrafficPredictionComponent;
  let fixture: ComponentFixture<TrafficPredictionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TrafficPredictionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TrafficPredictionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
