import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IframesComponent } from './iframes.component';

describe('IframesComponent', () => {
  let component: IframesComponent;
  let fixture: ComponentFixture<IframesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IframesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IframesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
