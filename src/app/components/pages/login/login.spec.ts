import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Login } from './login';
import { routes } from '../../../app.routes';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter(routes)],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('deve manter o formulário inválido quando usuário e senha estão vazios', () => {
    expect(component.form.invalid).toBe(true);
  });

  it('deve autenticar com sucesso usando admin/admin', async () => {
    component.form.setValue({ usuario: 'admin', senha: 'admin' });
    component.entrar();

    expect(component.autenticando()).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 700));

    expect(component.autenticando()).toBe(false);
    expect(component.mensagemErro()).toBeNull();
  });

  it('deve exibir mensagem de erro para credenciais inválidas', async () => {
    component.form.setValue({ usuario: 'admin', senha: 'errada' });
    component.entrar();

    await new Promise((resolve) => setTimeout(resolve, 700));

    expect(component.mensagemErro()).toBe('Usuário ou senha inválidos.');
  });
});
