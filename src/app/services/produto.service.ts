import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, combineLatest, of, throwError } from 'rxjs';
import { catchError, debounceTime, delay, distinctUntilChanged, finalize, map, startWith, switchMap, tap } from 'rxjs/operators';
import { Produto, ProdutoEstatisticas } from '../models/produto.model';

/**
 * Simula uma camada de dados assíncrona (como uma API HTTP) usando RxJS,
 * mantendo o estado da aplicação em BehaviorSubjects.
 */
@Injectable({ providedIn: 'root' })
export class ProdutoService {
  private readonly LIMITE_ESTOQUE_BAIXO = 5;

  // Estado (fonte única da verdade) mantido em memória via BehaviorSubject
  private readonly produtosSubject = new BehaviorSubject<Produto[]>([
    { id: 1, nome: 'Teclado Mecânico', categoria: 'Periféricos', preco: 349.9, estoque: 12, ativo: true },
    { id: 2, nome: 'Mouse Gamer', categoria: 'Periféricos', preco: 159.9, estoque: 3, ativo: true },
    { id: 3, nome: 'Monitor 27"', categoria: 'Monitores', preco: 1299.0, estoque: 0, ativo: true },
    { id: 4, nome: 'Headset Bluetooth', categoria: 'Áudio', preco: 249.5, estoque: 8, ativo: false },
  ]);

  // Subject usado como "gatilho" para o termo de busca digitado pelo usuário
  private readonly termoBuscaSubject = new Subject<string>();

  // Controla estado de carregamento das operações assíncronas
  private readonly carregandoSubject = new BehaviorSubject<boolean>(false);
  readonly carregando$ = this.carregandoSubject.asObservable();

  // Stream de erros para ser exibido na UI
  private readonly erroSubject = new Subject<string>();
  readonly erro$ = this.erroSubject.asObservable();

  /** Stream público e somente leitura da lista completa de produtos */
  readonly produtos$: Observable<Produto[]> = this.produtosSubject.asObservable();

  /** Stream do termo de busca, com debounce para evitar filtragens a cada tecla digitada */
  private readonly termoBuscaDebounced$ = this.termoBuscaSubject.pipe(
    startWith(''),
    debounceTime(300),
    distinctUntilChanged(),
  );

  /**
   * combineLatest: sempre que a lista de produtos OU o termo de busca mudarem,
   * a lista filtrada é recalculada automaticamente.
   */
  readonly produtosFiltrados$: Observable<Produto[]> = combineLatest([
    this.produtos$,
    this.termoBuscaDebounced$,
  ]).pipe(
    map(([produtos, termo]) =>
      produtos.filter((p) => p.nome.toLowerCase().includes(termo.trim().toLowerCase()))
    ),
  );

  /** Estatísticas derivadas da lista de produtos, recalculadas reativamente */
  readonly estatisticas$: Observable<ProdutoEstatisticas> = this.produtos$.pipe(
    map((produtos) => ({
      totalProdutos: produtos.length,
      valorTotalEstoque: produtos.reduce((acc, p) => acc + p.preco * p.estoque, 0),
      produtosBaixoEstoque: produtos.filter((p) => p.estoque < this.LIMITE_ESTOQUE_BAIXO).length,
      produtosAtivos: produtos.filter((p) => p.ativo).length,
    })),
  );

  /** Atualiza o termo de busca; o filtro reage automaticamente via combineLatest */
  buscar(termo: string): void {
    this.termoBuscaSubject.next(termo);
  }

  /** Snapshot síncrono do estado atual (usado por outros services para validações) */
  produtosAtuais(): Produto[] {
    return this.produtosSubject.value;
  }

  /** switchMap garante que, se uma nova requisição de busca chegar, a anterior é cancelada */
  buscarPorId$(id: number): Observable<Produto | undefined> {
    return this.termoBuscaSubject.pipe(
      startWith(''),
      switchMap(() => this.produtos$),
      map((produtos) => produtos.find((p) => p.id === id)),
    );
  }

  adicionar(novo: Omit<Produto, 'id'>): Observable<Produto> {
    const erroValidacao = this.validar(novo);
    if (erroValidacao) {
      return throwError(() => new Error(erroValidacao));
    }

    this.carregandoSubject.next(true);
    const produtoCriado: Produto = { ...novo, id: this.proximoId() };

    return of(produtoCriado).pipe(
      delay(400), // simula latência de rede
      tap((produto) => {
        this.produtosSubject.next([...this.produtosSubject.value, produto]);
      }),
      catchError((err) => {
        this.erroSubject.next('Erro ao adicionar produto.');
        return throwError(() => err);
      }),
      finalize(() => this.carregandoSubject.next(false)),
    );
  }

  atualizar(id: number, alteracoes: Partial<Produto>): Observable<Produto> {
    const atual = this.produtosSubject.value.find((p) => p.id === id);
    if (!atual) {
      return throwError(() => new Error('Produto não encontrado.'));
    }

    const atualizado = { ...atual, ...alteracoes };
    const erroValidacao = this.validar(atualizado);
    if (erroValidacao) {
      return throwError(() => new Error(erroValidacao));
    }

    this.carregandoSubject.next(true);
    return of(atualizado).pipe(
      delay(300),
      tap((produto) => {
        this.produtosSubject.next(
          this.produtosSubject.value.map((p) => (p.id === id ? produto : p)),
        );
      }),
      catchError((err) => {
        this.erroSubject.next('Erro ao atualizar produto.');
        return throwError(() => err);
      }),
      finalize(() => this.carregandoSubject.next(false)),
    );
  }

  remover(id: number): Observable<void> {
    this.carregandoSubject.next(true);
    return of(void 0).pipe(
      delay(300),
      tap(() => {
        this.produtosSubject.next(this.produtosSubject.value.filter((p) => p.id !== id));
      }),
      finalize(() => this.carregandoSubject.next(false)),
    );
  }

  /** Regra de negócio: categoria é obrigatória, preço deve ser positivo e estoque não pode ser negativo */
  private validar(produto: Omit<Produto, 'id'> | Produto): string | null {
    if (!produto.nome?.trim()) return 'Nome do produto é obrigatório.';
    if (!produto.categoria?.trim()) return 'Categoria é obrigatória.';
    if (produto.preco <= 0) return 'Preço deve ser maior que zero.';
    if (produto.estoque < 0) return 'Estoque não pode ser negativo.';
    return null;
  }

  private proximoId(): number {
    const ids = this.produtosSubject.value.map((p) => p.id);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }
}
