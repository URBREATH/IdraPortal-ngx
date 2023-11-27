import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataletsManagementComponent } from './datalets-management.component';

describe('DataletsManagementComponent', () => {
  let component: DataletsManagementComponent;
  let fixture: ComponentFixture<DataletsManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DataletsManagementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DataletsManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
