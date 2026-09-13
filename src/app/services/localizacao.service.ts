import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, combineLatest, of, throwError } from 'rxjs';
import { debounceTime, delay, distinctUntilChanged, finalize, map, startWith, tap } from 'rxjs/operators';
import { Localizacao, LocalizacaoComOcupacao } from '../models/localizacao.model';

/** Camada de dados reativa para localizações (endereçamento dentro dos depósitos). */
@Injectable({ providedIn: 'root' })
export class LocalizacaoService {
  private readonly localizacoesSubject = new BehaviorSubject<Localizacao[]>([
    { id: 1, depositoId: 1, corredor: 'A1', prateleira: '01', posicao: '01', capacidade: 100, ocupacaoAtual: 40, ativa: true },
    { id: 2, depositoId: 1, corredor: 'A1', prateleira: '02', posicao: '01', capacidade: 100, ocupacaoAtual: 0, ativa: true },
    { id: 3, depositoId: 2, corredor: 'B2', prateleira: '05', posicao: '03', capacidade: 50, ocupacaoAtual: 50, ativa: true },
  ]);

  private readonly termoBuscaSubject = new Subject<string>();
  private readonly carregandoSubject = new BehaviorSubject<boolean>(false);
  readonly carregando$ = this.carregandoSubject.asObservable();

  private readonly erroSubject = new Subject<string>();
  readonly erro$ = this.erroSubject.asObservable();

  readonly localizacoes$: Observable<Localizacao[]> = this.localizacoesSubject.asObservable();

  private readonly termoBuscaDebounced$ = this.termoBuscaSubject.pipe(
    startWith(''),
    debounceTime(300),
    distinctUntilChanged(),
  );

  readonly localizacoesFiltradas$: Observable<LocalizacaoComOcupacao[]> = combineLatest([
    this.localizacoes$,
    this.termoBuscaDebounced$,
  ]).pipe(
    map(([localizacoes, termo]) => {
      const termoBusca = termo.trim().toLowerCase();
      return localizacoes
        .filter(
          (l) =>
            l.corredor.toLowerCase().includes(termoBusca) ||
            l.prateleira.toLowerCase().includes(termoBusca) ||
            l.posicao.toLowerCase().includes(termoBusca),
        )
        .map((l) => this.comPercentual(l));
    }),
  );

  buscar(termo: string): void {
    this.termoBuscaSubject.next(termo);
  }

  /** Snapshot síncrono do estado atual (usado por DepositoService para validar remoção) */
  localizacoesAtuais(): Localizacao[] {
    return this.localizacoesSubject.value;
  }

  localizacoesPorDeposito$(depositoId: number): Observable<LocalizacaoComOcupacao[]> {
    return this.localizacoes$.pipe(
      map((localizacoes) =>
        localizacoes.filter((l) => l.depositoId === depositoId).map((l) => this.comPercentual(l)),
      ),
    );
  }

  adicionar(nova: Omit<Localizacao, 'id'>): Observable<Localizacao> {
    const erroValidacao = this.validar(nova);
    if (erroValidacao) {
      return throwError(() => new Error(erroValidacao));
    }

    this.carregandoSubject.next(true);
    const criada: Localizacao = { ...nova, id: this.proximoId() };

    return of(criada).pipe(
      delay(400),
      tap((localizacao) => this.localizacoesSubject.next([...this.localizacoesSubject.value, localizacao])),
      finalize(() => this.carregandoSubject.next(false)),
    );
  }

  atualizar(id: number, alteracoes: Partial<Localizacao>): Observable<Localizacao> {
    const atual = this.localizacoesSubject.value.find((l) => l.id === id);
    if (!atual) {
      return throwError(() => new Error('Localização não encontrada.'));
    }

    const atualizada = { ...atual, ...alteracoes };
    const erroValidacao = this.validar(atualizada);
    if (erroValidacao) {
      return throwError(() => new Error(erroValidacao));
    }

    this.carregandoSubject.next(true);
    return of(atualizada).pipe(
      delay(300),
      tap((localizacao) => {
        this.localizacoesSubject.next(
          this.localizacoesSubject.value.map((l) => (l.id === id ? localizacao : l)),
        );
      }),
      finalize(() => this.carregandoSubject.next(false)),
    );
  }

  /** Regra de negócio: não remover localização ocupada */
  remover(id: number): Observable<void> {
    const localizacao = this.localizacoesSubject.value.find((l) => l.id === id);
    if (localizacao && localizacao.ocupacaoAtual > 0) {
      return throwError(() => new Error('Não é possível remover uma localização ocupada.'));
    }

    this.carregandoSubject.next(true);
    return of(void 0).pipe(
      delay(300),
      tap(() => this.localizacoesSubject.next(this.localizacoesSubject.value.filter((l) => l.id !== id))),
      finalize(() => this.carregandoSubject.next(false)),
    );
  }

  private comPercentual(localizacao: Localizacao): LocalizacaoComOcupacao {
    const percentualOcupacao =
      localizacao.capacidade > 0 ? (localizacao.ocupacaoAtual / localizacao.capacidade) * 100 : 0;
    return { ...localizacao, percentualOcupacao };
  }

  /** Regra de negócio: capacidade não pode ser negativa e ocupação não pode superar a capacidade */
  private validar(localizacao: Omit<Localizacao, 'id'> | Localizacao): string | null {
    if (!localizacao.corredor?.trim()) return 'Corredor é obrigatório.';
    if (localizacao.capacidade < 0) return 'Capacidade não pode ser negativa.';
    if (localizacao.ocupacaoAtual < 0) return 'Ocupação não pode ser negativa.';
    if (localizacao.ocupacaoAtual > localizacao.capacidade) {
      return 'Ocupação não pode ser maior que a capacidade.';
    }
    return null;
  }

  private proximoId(): number {
    const ids = this.localizacoesSubject.value.map((l) => l.id);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }
}
