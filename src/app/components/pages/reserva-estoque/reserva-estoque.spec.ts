import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReservaEstoquePage } from './reserva-estoque';

describe('ReservaEstoquePage', () => {
  let component: ReservaEstoquePage;
  let fixture: ComponentFixture<ReservaEstoquePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservaEstoquePage],
    }).compileComponents();

    fixture = TestBed.createComponent(ReservaEstoquePage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
