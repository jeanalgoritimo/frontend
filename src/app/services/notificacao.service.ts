import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Notificacao {
  tipo: 'sucesso' | 'erro';
  mensagem: string;
}

/** Canal simples de notificações (toasts) para feedback de operações do usuário. */
@Injectable({ providedIn: 'root' })
export class NotificacaoService {
  private readonly notificacaoSubject = new Subject<Notificacao>();
  readonly notificacao$ = this.notificacaoSubject.asObservable();

  sucesso(mensagem: string): void {
    this.notificacaoSubject.next({ tipo: 'sucesso', mensagem });
  }

  erro(mensagem: string): void {
    this.notificacaoSubject.next({ tipo: 'erro', mensagem });
  }
}
