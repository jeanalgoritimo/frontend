import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { authGuard, redirecionarSeAutenticadoGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('deve redirecionar para /login quando o usuário não está autenticado', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');

    const resultado = TestBed.runInInjectionContext(() =>
      authGuard({} as never, {} as never),
    );

    expect(resultado).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('deve permitir o acesso quando o usuário está autenticado', async () => {
    await firstValueFrom(authService.login('admin', 'admin'));

    const resultado = TestBed.runInInjectionContext(() =>
      authGuard({} as never, {} as never),
    );

    expect(resultado).toBe(true);
  });
});

describe('redirecionarSeAutenticadoGuard', () => {
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('deve permitir o acesso ao /login quando não autenticado', () => {
    const resultado = TestBed.runInInjectionContext(() =>
      redirecionarSeAutenticadoGuard({} as never, {} as never),
    );

    expect(resultado).toBe(true);
  });

  it('deve redirecionar para /dashboard quando já autenticado', async () => {
    await firstValueFrom(authService.login('admin', 'admin'));
    const navigateSpy = vi.spyOn(router, 'navigate');

    const resultado = TestBed.runInInjectionContext(() =>
      redirecionarSeAutenticadoGuard({} as never, {} as never),
    );

    expect(resultado).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
  });
});
