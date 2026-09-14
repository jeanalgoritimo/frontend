import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, provideRouter } from '@angular/router';
import { autorizacaoGuard } from './autorizacao.guard';

describe('autorizacaoGuard', () => {
  it('deve permitir ao administrador uma rota protegida', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const route = { data: { permissao: 'administracao.gerenciar' } } as unknown as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;
    const resultado = TestBed.runInInjectionContext(() => autorizacaoGuard(route, state));
    expect(resultado).toBe(true);
  });
});
