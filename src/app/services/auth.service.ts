import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, delay, map, of } from 'rxjs';

/** Chave usada no sessionStorage para persistir o indicador de sessão autenticada. */
export const CHAVE_SESSAO_AUTENTICADA = 'painel-gestao-autenticado';

/**
 * Serviço de autenticação.
 *
 * ATENÇÃO (uso educacional): as credenciais `admin`/`admin` são fixas e servem
 * apenas para demonstração local. Isso NÃO é uma solução de autenticação válida
 * para produção. A estrutura aqui (método `login` retornando `Observable<boolean>`)
 * foi pensada para futuramente ser substituída por uma chamada HTTP a uma API
 * ASP.NET Core que valide as credenciais e retorne um token JWT, persistindo o
 * token (e não uma senha) para as próximas requisições.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly autenticadoSubject = new BehaviorSubject<boolean>(this.lerSessao());

  /** Stream público do estado de autenticação, usado pela navbar e pelos guards. */
  readonly autenticado$: Observable<boolean> = this.autenticadoSubject.asObservable();

  /**
   * Login demonstrativo com credenciais fixas (admin/admin).
   * Simula uma chamada assíncrona (latência de rede) com `delay`.
   * TODO: substituir por `HttpClient.post<{ token: string }>('/api/auth/login', { usuario, senha })`
   * quando a API ASP.NET Core estiver disponível, guardando o token JWT em vez do indicador local.
   */
  login(usuario: string, senha: string): Observable<boolean> {
    const credenciaisValidas = usuario === 'admin' && senha === 'admin';

    return of(credenciaisValidas).pipe(
      delay(600),
      map((sucesso) => {
        if (sucesso) {
          this.iniciarSessao();
        }
        return sucesso;
      }),
    );
  }

  logout(): void {
    sessionStorage.removeItem(CHAVE_SESSAO_AUTENTICADA);
    this.autenticadoSubject.next(false);
  }

  estaAutenticado(): boolean {
    return this.autenticadoSubject.value;
  }

  private iniciarSessao(): void {
    // Apenas um indicador booleano é persistido — nunca a senha do usuário.
    sessionStorage.setItem(CHAVE_SESSAO_AUTENTICADA, 'true');
    this.autenticadoSubject.next(true);
  }

  private lerSessao(): boolean {
    if (typeof sessionStorage === 'undefined') return false;
    return sessionStorage.getItem(CHAVE_SESSAO_AUTENTICADA) === 'true';
  }
}
