import { TestBed } from '@angular/core/testing';
import { TemaService } from './tema.service';

describe('TemaService', () => {
  beforeEach(() => localStorage.clear());

  it('deve alternar e persistir o tema', () => {
    const service = TestBed.inject(TemaService);
    const inicial = localStorage.getItem('painel-gestao-tema');
    service.alternarTema();
    expect(localStorage.getItem('painel-gestao-tema')).not.toBe(inicial);
    expect(document.documentElement.getAttribute('data-bs-theme')).toBeTruthy();
  });
});
