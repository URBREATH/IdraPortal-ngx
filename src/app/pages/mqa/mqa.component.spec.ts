import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MqaComponent } from './mqa.component';

describe('MqaComponent', () => {
  let component: MqaComponent;
  let fixture: ComponentFixture<MqaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MqaComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MqaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
