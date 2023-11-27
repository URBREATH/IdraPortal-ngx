import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowDataletsComponent } from './show-datalets.component';

describe('ShowDataletsComponent', () => {
  let component: ShowDataletsComponent;
  let fixture: ComponentFixture<ShowDataletsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ShowDataletsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowDataletsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
