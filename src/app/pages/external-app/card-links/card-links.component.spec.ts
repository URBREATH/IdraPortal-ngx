import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CardLinksComponent } from './card-links.component';

describe('CardLinksComponent', () => {
  let component: CardLinksComponent;
  let fixture: ComponentFixture<CardLinksComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CardLinksComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardLinksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
