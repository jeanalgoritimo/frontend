import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subject, combineLatest, of, throwError } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, finalize, map, startWith, switchMap, tap } from 'rxjs/operators';
import {
  MovimentacaoEstoque,
  NovaMovimentacaoEstoque,
  SaldoDeposito,
  TipoMovimentacaoEstoque,
} from '../models/movimentacao-estoque.model';
import { ProdutoService } from './produto.service';
import { AtividadeService } from './atividade.service';

const TIPOS_QUE_AUMENTAM_ESTOQUE: TipoMovimentacaoEstoque[] = ['entrada', 'ajuste-positivo'];
const TIPOS_QUE_DIMINUEM_ESTOQUE: TipoMovimentacaoEstoque[] = ['saida', 'ajuste-negativo', 'devolucao'];

/** Mapeia cada tipo para o tipo "oposto", usado ao cancelar uma movimentação por estorno. */
const TIPO_INVERSO: Record<TipoMovimentacaoEstoque, TipoMovimentacaoEstoque> = {
  entrada: 'saida',
  saida: 'entrada',
  'ajuste-positivo': 'ajuste-negativo',
  'ajuste-negativo': 'ajuste-positivo',
  transferencia: 'transferencia',
  devolucao: 'entrada',
};

/**
 * Log de movimentações de estoque (entrada, saída, ajustes, transferência, devolução).
 * É a fonte única de verdade para o histórico; `Produto.estoque` é mantido em
 * sincronia através de `ProdutoService.ajustarEstoque()`.
 */
@Injectable({ providedIn: 'root' })
export class MovimentacaoEstoqueService {
  private readonly produtoService = inject(ProdutoService);
  private readonly atividadeService = inject(AtividadeService);

  private readonly movimentacoesSubject = new BehaviorSubject<MovimentacaoEstoque[]>([]);
  private readonly termoBuscaSubject = new Subject<string>();
  private readonly carregandoSubject = new BehaviorSubject<boolean>(false);
  readonly carregando$ = this.carregandoSubject.asObservable();

  private readonly erroSubject = new Subject<string>();
  readonly erro$ = this.erroSubject.asObservable();

  readonly movimentacoes$: Observable<MovimentacaoEstoque[]> = this.movimentacoesSubject.asObservable();

  private readonly termoBuscaDebounced$ = this.termoBuscaSubject.pipe(
    startWith(''),
    debounceTime(300),
    distinctUntilChanged(),
  );

  readonly movimentacoesFiltradas$: Observable<MovimentacaoEstoque[]> = combineLatest([
    this.movimentacoes$,
    this.termoBuscaDebounced$,
  ]).pipe(
    map(([movimentacoes, termo]) => {
      const termoBusca = termo.trim().toLowerCase();
      return movimentacoes
        .slice()
        .reverse()
        .filter(
          (m) =>
            m.codigo.toLowerCase().includes(termoBusca) ||
            m.documentoReferencia.toLowerCase().includes(termoBusca),
        );
    }),
  );

  /** Saldo por (produto, depósito), derivado somando as movimentações confirmadas. */
  readonly saldosPorDeposito$: Observable<SaldoDeposito[]> = this.movimentacoes$.pipe(
    map((movimentacoes) => this.calcularSaldosPorDeposito(movimentacoes)),
  );

  buscar(termo: string): void {
    this.termoBuscaSubject.next(termo);
  }

  /** switchMap garante que, ao trocar o produto observado, a assinatura anterior é descartada */
  movimentacoesPorProduto$(produtoId: number): Observable<MovimentacaoEstoque[]> {
    return this.movimentacoes$.pipe(
      switchMap((movimentacoes) => of(movimentacoes.filter((m) => m.produtoId === produtoId))),
    );
  }

  registrar(dto: NovaMovimentacaoEstoque): Observable<MovimentacaoEstoque> {
    const erroValidacao = this.validar(dto);
    if (erroValidacao) {
      return throwError(() => new Error(erroValidacao));
    }

    const produtoAtual = this.produtoService.produtosAtuais().find((p) => p.id === dto.produtoId);
    if (!produtoAtual) {
      return throwError(() => new Error('Produto não encontrado.'));
    }

    const delta = this.calcularDelta(dto.tipo, dto.quantidade);
    const saldoAnterior = produtoAtual.estoque;
    const saldoPosterior = saldoAnterior + delta;

    this.carregandoSubject.next(true);

    return this.produtoService.ajustarEstoque(dto.produtoId, delta).pipe(
      map(() => this.criarRegistro(dto, saldoAnterior, saldoPosterior)),
      tap((movimentacao) => {
        this.movimentacoesSubject.next([...this.movimentacoesSubject.value, movimentacao]);
        this.atividadeService.registrar({
          usuario: dto.usuarioResponsavel,
          entidade: 'MovimentacaoEstoque',
          entidadeId: movimentacao.id,
          acao: 'inclusao',
          descricao: `Movimentação ${movimentacao.tipo} de ${movimentacao.quantidade} un. (${movimentacao.codigo})`,
        });
      }),
      catchError((err) => {
        this.erroSubject.next('Erro ao registrar movimentação.');
        return throwError(() => err);
      }),
      finalize(() => this.carregandoSubject.next(false)),
    );
  }

  /** Cancela uma movimentação confirmada criando uma movimentação inversa (estorno). O registro original nunca é apagado. */
  cancelar(movimentacaoId: number, usuarioResponsavel: string, observacao?: string): Observable<MovimentacaoEstoque> {
    const original = this.movimentacoesSubject.value.find((m) => m.id === movimentacaoId);
    if (!original) {
      return throwError(() => new Error('Movimentação não encontrada.'));
    }
    if (original.status !== 'confirmada') {
      return throwError(() => new Error('Apenas movimentações confirmadas podem ser canceladas.'));
    }

    const dtoEstorno: NovaMovimentacaoEstoque = {
      produtoId: original.produtoId,
      tipo: TIPO_INVERSO[original.tipo],
      quantidade: original.quantidade,
      depositoOrigemId: original.depositoDestinoId,
      depositoDestinoId: original.depositoOrigemId,
      localizacaoOrigemId: original.localizacaoDestinoId,
      localizacaoDestinoId: original.localizacaoOrigemId,
      usuarioResponsavel,
      documentoReferencia: original.codigo,
      custoUnitario: original.custoUnitario,
      observacao: observacao?.trim() || `Estorno da movimentação ${original.codigo}`,
    };

    return this.registrar(dtoEstorno).pipe(
      map((estorno) => ({ ...estorno, movimentacaoOrigemId: original.id }) as MovimentacaoEstoque),
      tap((vinculado) => {
        this.movimentacoesSubject.next(
          this.movimentacoesSubject.value.map((m) => (m.id === vinculado.id ? vinculado : m)),
        );
        this.atividadeService.registrar({
          usuario: usuarioResponsavel,
          entidade: 'MovimentacaoEstoque',
          entidadeId: original.id,
          acao: 'cancelamento',
          descricao: `Movimentação ${original.codigo} estornada pela movimentação ${vinculado.codigo}.`,
        });
      }),
    );
  }

  /** Regra de negócio: quantidade positiva, transferência com origem/destino distintos e saída limitada ao saldo disponível */
  private validar(dto: NovaMovimentacaoEstoque): string | null {
    if (dto.quantidade <= 0) return 'Quantidade deve ser maior que zero.';

    if (dto.tipo === 'transferencia') {
      if (!dto.depositoOrigemId || !dto.depositoDestinoId) {
        return 'Transferência exige depósito de origem e destino.';
      }
      if (dto.depositoOrigemId === dto.depositoDestinoId) {
        return 'Depósito de origem e destino devem ser diferentes.';
      }
    }

    if (TIPOS_QUE_DIMINUEM_ESTOQUE.includes(dto.tipo) || dto.tipo === 'transferencia') {
      const produto = this.produtoService.produtosAtuais().find((p) => p.id === dto.produtoId);
      const saldoDisponivel = produto?.estoque ?? 0;
      if (dto.quantidade > saldoDisponivel) {
        return 'Quantidade maior que o saldo disponível.';
      }
    }

    return null;
  }

  private calcularDelta(tipo: TipoMovimentacaoEstoque, quantidade: number): number {
    if (TIPOS_QUE_AUMENTAM_ESTOQUE.includes(tipo)) return quantidade;
    if (TIPOS_QUE_DIMINUEM_ESTOQUE.includes(tipo)) return -quantidade;
    return 0; // transferência: não altera o total do produto, apenas move entre depósitos
  }

  private criarRegistro(
    dto: NovaMovimentacaoEstoque,
    saldoAnterior: number,
    saldoPosterior: number,
  ): MovimentacaoEstoque {
    const id = this.proximoId();
    return {
      ...dto,
      id,
      codigo: `MOV-${String(id).padStart(5, '0')}`,
      dataHora: new Date(),
      saldoAnterior,
      saldoPosterior,
      status: 'confirmada',
    };
  }

  private calcularSaldosPorDeposito(movimentacoes: MovimentacaoEstoque[]): SaldoDeposito[] {
    const saldos = new Map<string, SaldoDeposito>();

    const aplicar = (produtoId: number, depositoId: number | null, quantidade: number) => {
      if (depositoId == null) return;
      const chave = `${produtoId}|${depositoId}`;
      const atual = saldos.get(chave) ?? { produtoId, depositoId, quantidade: 0 };
      atual.quantidade += quantidade;
      saldos.set(chave, atual);
    };

    for (const m of movimentacoes.filter((m) => m.status === 'confirmada')) {
      if (TIPOS_QUE_AUMENTAM_ESTOQUE.includes(m.tipo)) {
        aplicar(m.produtoId, m.depositoDestinoId, m.quantidade);
      } else if (TIPOS_QUE_DIMINUEM_ESTOQUE.includes(m.tipo)) {
        aplicar(m.produtoId, m.depositoOrigemId, -m.quantidade);
      } else if (m.tipo === 'transferencia') {
        aplicar(m.produtoId, m.depositoOrigemId, -m.quantidade);
        aplicar(m.produtoId, m.depositoDestinoId, m.quantidade);
      }
    }

    return Array.from(saldos.values());
  }

  private proximoId(): number {
    const ids = this.movimentacoesSubject.value.map((m) => m.id);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }
}
