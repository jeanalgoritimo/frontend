import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AcaoAtividade, RegistroAtividade } from '../models/atividade.model';

export interface NovaAtividade {
  usuario: string;
  entidade: string;
  entidadeId: number | string;
  acao: AcaoAtividade;
  descricao: string;
  valorAnterior?: unknown;
  valorPosterior?: unknown;
}

/**
 * Log central de atividades do sistema, em memória. Cada módulo chama `registrar()`
 * ao concluir uma operação relevante (inclusão, alteração, cancelamento, etc.).
 * Serve de base para a futura tela de Auditoria (Fase 3).
 */
@Injectable({ providedIn: 'root' })
export class AtividadeService {
  private readonly atividadesSubject = new BehaviorSubject<RegistroAtividade[]>([]);

  readonly atividades$: Observable<RegistroAtividade[]> = this.atividadesSubject.asObservable();

  /** Últimas N atividades, mais recentes primeiro — usado no feed do Dashboard */
  ultimasAtividades$(quantidade = 5): Observable<RegistroAtividade[]> {
    return this.atividades$.pipe(
      map((atividades) => atividades.slice().reverse().slice(0, quantidade)),
    );
  }

  registrar(dados: NovaAtividade): void {
    const registro: RegistroAtividade = {
      id: this.proximoId(),
      dataHora: new Date(),
      ...dados,
    };
    this.atividadesSubject.next([...this.atividadesSubject.value, registro]);
  }

  private proximoId(): number {
    const ids = this.atividadesSubject.value.map((a) => a.id);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }
}
