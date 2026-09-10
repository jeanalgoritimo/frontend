import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subject, combineLatest, of, throwError } from 'rxjs';
import { debounceTime, delay, distinctUntilChanged, finalize, map, startWith, tap } from 'rxjs/operators';
import { Categoria } from '../models/categoria.model';
import { ProdutoService } from './produto.service';

/** Camada de dados reativa para categorias de produtos, com regra de integridade referencial. */
@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private readonly produtoService = inject(ProdutoService);

  private readonly categoriasSubject = new BehaviorSubject<Categoria[]>([
    { id: 1, nome: 'Periféricos', ativa: true },
    { id: 2, nome: 'Monitores', ativa: true },
    { id: 3, nome: 'Áudio', ativa: true },
  ]);

  private readonly termoBuscaSubject = new Subject<string>();
  private readonly carregandoSubject = new BehaviorSubject<boolean>(false);
  readonly carregando$ = this.carregandoSubject.asObservable();

  readonly categorias$: Observable<Categoria[]> = this.categoriasSubject.asObservable();

  /** Usado no combobox de Produtos: somente categorias ativas */
  readonly categoriasAtivas$: Observable<Categoria[]> = this.categorias$.pipe(
    map((categorias) => categorias.filter((c) => c.ativa)),
  );

  private readonly termoBuscaDebounced$ = this.termoBuscaSubject.pipe(
    startWith(''),
    debounceTime(300),
    distinctUntilChanged(),
  );

  readonly categoriasFiltradas$: Observable<Categoria[]> = combineLatest([
    this.categorias$,
    this.termoBuscaDebounced$,
  ]).pipe(
    map(([categorias, termo]) =>
      categorias.filter((c) => c.nome.toLowerCase().includes(termo.trim().toLowerCase())),
    ),
  );

  buscar(termo: string): void {
    this.termoBuscaSubject.next(termo);
  }

  adicionar(nome: string): Observable<Categoria> {
    const erroValidacao = this.validarNome(nome);
    if (erroValidacao) {
      return throwError(() => new Error(erroValidacao));
    }

    this.carregandoSubject.next(true);
    const categoriaCriada: Categoria = { id: this.proximoId(), nome: nome.trim(), ativa: true };

    return of(categoriaCriada).pipe(
      delay(400),
      tap((categoria) => this.categoriasSubject.next([...this.categoriasSubject.value, categoria])),
      finalize(() => this.carregandoSubject.next(false)),
    );
  }

  atualizar(id: number, alteracoes: Partial<Categoria>): Observable<Categoria> {
    const atual = this.categoriasSubject.value.find((c) => c.id === id);
    if (!atual) {
      return throwError(() => new Error('Categoria não encontrada.'));
    }

    const atualizado = { ...atual, ...alteracoes };
    if (alteracoes.nome !== undefined) {
      const erroValidacao = this.validarNome(alteracoes.nome, id);
      if (erroValidacao) {
        return throwError(() => new Error(erroValidacao));
      }
    }

    this.carregandoSubject.next(true);
    return of(atualizado).pipe(
      delay(300),
      tap((categoria) => {
        this.categoriasSubject.next(
          this.categoriasSubject.value.map((c) => (c.id === id ? categoria : c)),
        );
      }),
      finalize(() => this.carregandoSubject.next(false)),
    );
  }

  /** Regra de negócio: não permite remover categoria em uso por algum produto */
  remover(id: number): Observable<void> {
    const categoria = this.categoriasSubject.value.find((c) => c.id === id);
    const emUso = this.produtoService.produtosAtuais().some((p) => p.categoria === categoria?.nome);
    if (emUso) {
      return throwError(() => new Error('Não é possível remover uma categoria em uso por produtos.'));
    }

    this.carregandoSubject.next(true);
    return of(void 0).pipe(
      delay(300),
      tap(() => this.categoriasSubject.next(this.categoriasSubject.value.filter((c) => c.id !== id))),
      finalize(() => this.carregandoSubject.next(false)),
    );
  }

  private validarNome(nome: string, idIgnorado?: number): string | null {
    if (!nome?.trim()) return 'Nome da categoria é obrigatório.';
    const existe = this.categoriasSubject.value.some(
      (c) => c.id !== idIgnorado && c.nome.toLowerCase() === nome.trim().toLowerCase(),
    );
    if (existe) return 'Já existe uma categoria com este nome.';
    return null;
  }

  private proximoId(): number {
    const ids = this.categoriasSubject.value.map((c) => c.id);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }
}
