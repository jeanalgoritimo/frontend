import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DepositoPage } from './deposito';

describe('DepositoPage', () => {
  let component: DepositoPage;
  let fixture: ComponentFixture<DepositoPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DepositoPage],
    }).compileComponents();

    fixture = TestBed.createComponent(DepositoPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
