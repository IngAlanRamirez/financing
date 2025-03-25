import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotFoundPurchasesComponent } from './not-found-purchases.component';

describe('NotFoundPurchasesComponent', () => {
  let component: NotFoundPurchasesComponent;
  let fixture: ComponentFixture<NotFoundPurchasesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundPurchasesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotFoundPurchasesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
