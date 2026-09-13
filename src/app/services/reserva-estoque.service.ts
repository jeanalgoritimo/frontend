import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subject, combineLatest, of, throwError } from 'rxjs';
import { debounceTime, delay, distinctUntilChanged, finalize, map, startWith, tap } from 'rxjs/operators';
import { DisponibilidadeProduto, NovaReservaEstoque, ReservaEstoque } from '../models/reserva-estoque.model';
import { ProdutoService } from './produto.service';
import { AtividadeService } from './atividade.service';

/**
 * Reservas de estoque: reduzem o estoque "disponível" sem alterar o estoque físico
 * (`Produto.estoque`). A disponibilidade é sempre derivada reativamente.
 */
@Injectable({ providedIn: 'root' })
export class ReservaEstoqueService {
  private readonly produtoService = inject(ProdutoService);
  private readonly atividadeService = inject(AtividadeService);

  private readonly reservasSubject = new BehaviorSubject<ReservaEstoque[]>([]);
  private readonly termoBuscaSubject = new Subject<string>();
  private readonly carregandoSubject = new BehaviorSubject<boolean>(false);
  readonly carregando$ = this.carregandoSubject.asObservable();

  private readonly erroSubject = new Subject<string>();
  readonly erro$ = this.erroSubject.asObservable();

  readonly reservas$: Observable<ReservaEstoque[]> = this.reservasSubject.asObservable();

  private readonly termoBuscaDebounced$ = this.termoBuscaSubject.pipe(
    startWith(''),
    debounceTime(300),
    distinctUntilChanged(),
  );

  readonly reservasFiltradas$: Observable<ReservaEstoque[]> = combineLatest([
    this.reservas$,
    this.termoBuscaDebounced$,
  ]).pipe(
    map(([reservas, termo]) => {
      const termoBusca = termo.trim().toLowerCase();
      return reservas
        .slice()
        .reverse()
        .filter(
          (r) =>
            r.solicitante.toLowerCase().includes(termoBusca) ||
            r.finalidade.toLowerCase().includes(termoBusca),
        );
    }),
  );

  /** Disponibilidade (físico, reservado, disponível) por produto — recalculada reativamente */
  readonly disponibilidadePorProduto$: Observable<DisponibilidadeProduto[]> = combineLatest([
    this.produtoService.produtos$,
    this.reservas$,
  ]).pipe(
    map(([produtos, reservas]) =>
      produtos.map((produto) => {
        const reservado = reservas
          .filter((r) => r.produtoId === produto.id && r.status === 'ativa')
          .reduce((total, r) => total + r.quantidade, 0);

        return {
          produtoId: produto.id,
          estoqueFisico: produto.estoque,
          reservado,
          disponivel: produto.estoque - reservado,
        };
      }),
    ),
  );

  buscar(termo: string): void {
    this.termoBuscaSubject.next(termo);
  }

  criar(dto: NovaReservaEstoque): Observable<ReservaEstoque> {
    const erroValidacao = this.validar(dto);
    if (erroValidacao) {
      return throwError(() => new Error(erroValidacao));
    }

    this.carregandoSubject.next(true);
    const criada: ReservaEstoque = { ...dto, id: this.proximoId(), status: 'ativa' };

    return of(criada).pipe(
      delay(400),
      tap((reserva) => {
        this.reservasSubject.next([...this.reservasSubject.value, reserva]);
        this.atividadeService.registrar({
          usuario: reserva.solicitante,
          entidade: 'ReservaEstoque',
          entidadeId: reserva.id,
          acao: 'inclusao',
          descricao: `Reserva de ${reserva.quantidade} un. para "${reserva.finalidade}".`,
        });
      }),
      finalize(() => this.carregandoSubject.next(false)),
    );
  }

  /** Marca a reserva como atendida (consumida por uma saída de estoque) */
  atender(id: number): Observable<ReservaEstoque> {
    return this.mudarStatus(id, 'atendida', ['ativa']);
  }

  cancelar(id: number): Observable<ReservaEstoque> {
    return this.mudarStatus(id, 'cancelada', ['ativa']);
  }

  /** Verifica reservas ativas vencidas e as marca como expiradas (chamado ao abrir a tela) */
  sincronizarExpiracoes(): void {
    const agora = new Date();
    const atualizadas = this.reservasSubject.value.map((r) =>
      r.status === 'ativa' && r.validade < agora ? { ...r, status: 'expirada' as const } : r,
    );
    this.reservasSubject.next(atualizadas);
  }

  private mudarStatus(
    id: number,
    novoStatus: ReservaEstoque['status'],
    statusPermitidos: ReservaEstoque['status'][],
  ): Observable<ReservaEstoque> {
    const atual = this.reservasSubject.value.find((r) => r.id === id);
    if (!atual) {
      return throwError(() => new Error('Reserva não encontrada.'));
    }
    if (!statusPermitidos.includes(atual.status)) {
      return throwError(() => new Error('Esta reserva não pode mudar para o status solicitado.'));
    }

    this.carregandoSubject.next(true);
    const atualizada: ReservaEstoque = { ...atual, status: novoStatus };

    return of(atualizada).pipe(
      delay(300),
      tap((reserva) => {
        this.reservasSubject.next(this.reservasSubject.value.map((r) => (r.id === id ? reserva : r)));
      }),
      finalize(() => this.carregandoSubject.next(false)),
    );
  }

  /** Regra de negócio: quantidade positiva e não superior ao estoque disponível do produto */
  private validar(dto: NovaReservaEstoque): string | null {
    if (dto.quantidade <= 0) return 'Quantidade deve ser maior que zero.';

    const produto = this.produtoService.produtosAtuais().find((p) => p.id === dto.produtoId);
    if (!produto) return 'Produto não encontrado.';

    const reservadoAtual = this.reservasSubject.value
      .filter((r) => r.produtoId === dto.produtoId && r.status === 'ativa')
      .reduce((total, r) => total + r.quantidade, 0);

    const disponivel = produto.estoque - reservadoAtual;
    if (dto.quantidade > disponivel) {
      return 'Quantidade maior que o estoque disponível.';
    }

    return null;
  }

  private proximoId(): number {
    const ids = this.reservasSubject.value.map((r) => r.id);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }
}
