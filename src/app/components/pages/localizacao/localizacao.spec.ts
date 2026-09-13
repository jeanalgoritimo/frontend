import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LocalizacaoPage } from './localizacao';

describe('LocalizacaoPage', () => {
  let component: LocalizacaoPage;
  let fixture: ComponentFixture<LocalizacaoPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocalizacaoPage],
    }).compileComponents();

    fixture = TestBed.createComponent(LocalizacaoPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
