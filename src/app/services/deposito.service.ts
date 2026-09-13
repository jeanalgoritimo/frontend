import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subject, combineLatest, of, throwError } from 'rxjs';
import { debounceTime, delay, distinctUntilChanged, finalize, map, startWith, tap } from 'rxjs/operators';
import { Deposito } from '../models/deposito.model';
import { LocalizacaoService } from './localizacao.service';

/** Camada de dados reativa para depósitos (armazéns/centros de distribuição). */
@Injectable({ providedIn: 'root' })
export class DepositoService {
  private readonly localizacaoService = inject(LocalizacaoService);

  private readonly depositosSubject = new BehaviorSubject<Deposito[]>([
    { id: 1, codigo: 'DEP-01', nome: 'Depósito Central', descricao: 'Armazém principal', endereco: 'Rua Industrial, 100', responsavel: 'Ana Souza', ativo: true },
    { id: 2, codigo: 'DEP-02', nome: 'Filial Sul', descricao: 'Centro de distribuição regional', endereco: 'Av. das Indústrias, 500', responsavel: 'Bruno Lima', ativo: true },
  ]);

  private readonly termoBuscaSubject = new Subject<string>();
  private readonly carregandoSubject = new BehaviorSubject<boolean>(false);
  readonly carregando$ = this.carregandoSubject.asObservable();

  private readonly erroSubject = new Subject<string>();
  readonly erro$ = this.erroSubject.asObservable();

  readonly depositos$: Observable<Deposito[]> = this.depositosSubject.asObservable();

  /** Somente depósitos ativos — usado nos combobox de origem/destino das movimentações */
  readonly depositosAtivos$: Observable<Deposito[]> = this.depositos$.pipe(
    map((depositos) => depositos.filter((d) => d.ativo)),
  );

  private readonly termoBuscaDebounced$ = this.termoBuscaSubject.pipe(
    startWith(''),
    debounceTime(300),
    distinctUntilChanged(),
  );

  readonly depositosFiltrados$: Observable<Deposito[]> = combineLatest([
    this.depositos$,
    this.termoBuscaDebounced$,
  ]).pipe(
    map(([depositos, termo]) =>
      depositos.filter(
        (d) =>
          d.nome.toLowerCase().includes(termo.trim().toLowerCase()) ||
          d.codigo.toLowerCase().includes(termo.trim().toLowerCase()),
      ),
    ),
  );

  buscar(termo: string): void {
    this.termoBuscaSubject.next(termo);
  }

  /** Snapshot síncrono do estado atual */
  depositosAtuais(): Deposito[] {
    return this.depositosSubject.value;
  }

  adicionar(novo: Omit<Deposito, 'id'>): Observable<Deposito> {
    const erroValidacao = this.validar(novo);
    if (erroValidacao) {
      return throwError(() => new Error(erroValidacao));
    }

    this.carregandoSubject.next(true);
    const criado: Deposito = { ...novo, id: this.proximoId() };

    return of(criado).pipe(
      delay(400),
      tap((deposito) => this.depositosSubject.next([...this.depositosSubject.value, deposito])),
      finalize(() => this.carregandoSubject.next(false)),
    );
  }

  atualizar(id: number, alteracoes: Partial<Deposito>): Observable<Deposito> {
    const atual = this.depositosSubject.value.find((d) => d.id === id);
    if (!atual) {
      return throwError(() => new Error('Depósito não encontrado.'));
    }

    const atualizado = { ...atual, ...alteracoes };
    if (alteracoes.codigo !== undefined || alteracoes.nome !== undefined) {
      const erroValidacao = this.validar(atualizado, id);
      if (erroValidacao) {
        return throwError(() => new Error(erroValidacao));
      }
    }

    this.carregandoSubject.next(true);
    return of(atualizado).pipe(
      delay(300),
      tap((deposito) => {
        this.depositosSubject.next(
          this.depositosSubject.value.map((d) => (d.id === id ? deposito : d)),
        );
      }),
      finalize(() => this.carregandoSubject.next(false)),
    );
  }

  /** Regra de negócio: não remover depósito com localizações ocupadas (estoque alocado) */
  remover(id: number): Observable<void> {
    const possuiEstoque = this.localizacaoService
      .localizacoesAtuais()
      .some((l) => l.depositoId === id && l.ocupacaoAtual > 0);

    if (possuiEstoque) {
      return throwError(() => new Error('Não é possível remover um depósito com estoque alocado.'));
    }

    this.carregandoSubject.next(true);
    return of(void 0).pipe(
      delay(300),
      tap(() => this.depositosSubject.next(this.depositosSubject.value.filter((d) => d.id !== id))),
      finalize(() => this.carregandoSubject.next(false)),
    );
  }

  private validar(deposito: Omit<Deposito, 'id'> | Deposito, idIgnorado?: number): string | null {
    if (!deposito.codigo?.trim()) return 'Código do depósito é obrigatório.';
    if (!deposito.nome?.trim()) return 'Nome do depósito é obrigatório.';
    const codigoExiste = this.depositosSubject.value.some(
      (d) => d.id !== idIgnorado && d.codigo.toLowerCase() === deposito.codigo.toLowerCase(),
    );
    if (codigoExiste) return 'Já existe um depósito com este código.';
    return null;
  }

  private proximoId(): number {
    const ids = this.depositosSubject.value.map((d) => d.id);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }
}
