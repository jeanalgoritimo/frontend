import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MovimentacaoEstoquePage } from './movimentacao-estoque';

describe('MovimentacaoEstoquePage', () => {
  let component: MovimentacaoEstoquePage;
  let fixture: ComponentFixture<MovimentacaoEstoquePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovimentacaoEstoquePage],
    }).compileComponents();

    fixture = TestBed.createComponent(MovimentacaoEstoquePage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
