import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { AuthService, CHAVE_SESSAO_AUTENTICADA } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('deve autenticar com sucesso usando admin/admin', async () => {
    const sucesso = await firstValueFrom(service.login('admin', 'admin'));

    expect(sucesso).toBe(true);
    expect(service.estaAutenticado()).toBe(true);
  });

  it('deve rejeitar credenciais inválidas', async () => {
    const sucesso = await firstValueFrom(service.login('admin', 'senha-errada'));

    expect(sucesso).toBe(false);
    expect(service.estaAutenticado()).toBe(false);
  });

  it('deve criar a sessão no sessionStorage após o login', async () => {
    await firstValueFrom(service.login('admin', 'admin'));

    expect(sessionStorage.getItem(CHAVE_SESSAO_AUTENTICADA)).toBe('true');
  });

  it('deve remover a sessão do sessionStorage após o logout', async () => {
    await firstValueFrom(service.login('admin', 'admin'));

    service.logout();

    expect(service.estaAutenticado()).toBe(false);
    expect(sessionStorage.getItem(CHAVE_SESSAO_AUTENTICADA)).toBeNull();
  });
});
