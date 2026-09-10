import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, combineLatest, of, throwError } from 'rxjs';
import { debounceTime, delay, distinctUntilChanged, finalize, map, startWith, tap } from 'rxjs/operators';
import { Usuario, UsuarioEstatisticas } from '../models/usuario.model';

/**
 * Camada de dados assíncrona para usuários, usando RxJS para estado reativo,
 * busca com debounce e regras de negócio (ex.: proteção do último admin).
 */
@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly usuariosSubject = new BehaviorSubject<Usuario[]>([
    { id: 1, nome: 'Ana Souza', email: 'ana.souza@empresa.com', perfil: 'admin', ativo: true },
    { id: 2, nome: 'Bruno Lima', email: 'bruno.lima@empresa.com', perfil: 'usuario', ativo: true },
    { id: 3, nome: 'Carla Dias', email: 'carla.dias@empresa.com', perfil: 'usuario', ativo: false },
  ]);

  private readonly termoBuscaSubject = new Subject<string>();
  private readonly carregandoSubject = new BehaviorSubject<boolean>(false);
  readonly carregando$ = this.carregandoSubject.asObservable();

  private readonly erroSubject = new Subject<string>();
  readonly erro$ = this.erroSubject.asObservable();

  readonly usuarios$: Observable<Usuario[]> = this.usuariosSubject.asObservable();

  private readonly termoBuscaDebounced$ = this.termoBuscaSubject.pipe(
    startWith(''),
    debounceTime(300),
    distinctUntilChanged(),
  );

  readonly usuariosFiltrados$: Observable<Usuario[]> = combineLatest([
    this.usuarios$,
    this.termoBuscaDebounced$,
  ]).pipe(
    map(([usuarios, termo]) =>
      usuarios.filter(
        (u) =>
          u.nome.toLowerCase().includes(termo.trim().toLowerCase()) ||
          u.email.toLowerCase().includes(termo.trim().toLowerCase()),
      ),
    ),
  );

  readonly estatisticas$: Observable<UsuarioEstatisticas> = this.usuarios$.pipe(
    map((usuarios) => ({
      totalUsuarios: usuarios.length,
      usuariosAtivos: usuarios.filter((u) => u.ativo).length,
      totalAdmins: usuarios.filter((u) => u.perfil === 'admin' && u.ativo).length,
    })),
  );

  buscar(termo: string): void {
    this.termoBuscaSubject.next(termo);
  }

  adicionar(novo: Omit<Usuario, 'id'>): Observable<Usuario> {
    const erroValidacao = this.validarNovo(novo);
    if (erroValidacao) {
      return throwError(() => new Error(erroValidacao));
    }

    this.carregandoSubject.next(true);
    const usuarioCriado: Usuario = { ...novo, id: this.proximoId() };

    return of(usuarioCriado).pipe(
      delay(400),
      tap((usuario) => this.usuariosSubject.next([...this.usuariosSubject.value, usuario])),
      finalize(() => this.carregandoSubject.next(false)),
    );
  }

  /** Regra de negócio: não permite rebaixar/desativar o último administrador ativo */
  atualizar(id: number, alteracoes: Partial<Usuario>): Observable<Usuario> {
    const atual = this.usuariosSubject.value.find((u) => u.id === id);
    if (!atual) {
      return throwError(() => new Error('Usuário não encontrado.'));
    }

    const atualizado: Usuario = { ...atual, ...alteracoes };
    const erroValidacao = this.validarEdicao(atualizado);
    if (erroValidacao) {
      return throwError(() => new Error(erroValidacao));
    }

    const perdeAdminAtivo =
      atual.perfil === 'admin' &&
      atual.ativo &&
      (atualizado.perfil !== 'admin' || !atualizado.ativo) &&
      this.isUltimoAdminAtivo(id);
    if (perdeAdminAtivo) {
      const msg = 'Não é possível remover o status de administrador ativo do último admin.';
      this.erroSubject.next(msg);
      return throwError(() => new Error(msg));
    }

    this.carregandoSubject.next(true);
    return of(atualizado).pipe(
      delay(300),
      tap((usuario) => {
        this.usuariosSubject.next(
          this.usuariosSubject.value.map((u) => (u.id === id ? usuario : u)),
        );
      }),
      finalize(() => this.carregandoSubject.next(false)),
    );
  }

  /** Regra de negócio: não permite desativar o último administrador ativo */
  alternarAtivo(id: number): Observable<Usuario> {
    const usuario = this.usuariosSubject.value.find((u) => u.id === id);
    if (!usuario) {
      return throwError(() => new Error('Usuário não encontrado.'));
    }

    if (usuario.ativo && usuario.perfil === 'admin' && this.isUltimoAdminAtivo(id)) {
      const msg = 'Não é possível desativar o último administrador ativo.';
      this.erroSubject.next(msg);
      return throwError(() => new Error(msg));
    }

    this.carregandoSubject.next(true);
    const atualizado: Usuario = { ...usuario, ativo: !usuario.ativo };

    return of(atualizado).pipe(
      delay(300),
      tap((u) => {
        this.usuariosSubject.next(this.usuariosSubject.value.map((x) => (x.id === id ? u : x)));
      }),
      finalize(() => this.carregandoSubject.next(false)),
    );
  }

  /** Regra de negócio: não permite remover o último administrador ativo */
  remover(id: number): Observable<void> {
    const usuario = this.usuariosSubject.value.find((u) => u.id === id);
    if (usuario?.perfil === 'admin' && this.isUltimoAdminAtivo(id)) {
      const msg = 'Não é possível remover o último administrador ativo.';
      this.erroSubject.next(msg);
      return throwError(() => new Error(msg));
    }

    this.carregandoSubject.next(true);
    return of(void 0).pipe(
      delay(300),
      tap(() => this.usuariosSubject.next(this.usuariosSubject.value.filter((u) => u.id !== id))),
      finalize(() => this.carregandoSubject.next(false)),
    );
  }

  private isUltimoAdminAtivo(id: number): boolean {
    const admins = this.usuariosSubject.value.filter((u) => u.perfil === 'admin' && u.ativo);
    return admins.length === 1 && admins[0].id === id;
  }

  private validarNovo(usuario: Omit<Usuario, 'id'>): string | null {
    if (!usuario.nome?.trim()) return 'Nome é obrigatório.';
    if (!/^\S+@\S+\.\S+$/.test(usuario.email)) return 'E-mail inválido.';
    const emailExiste = this.usuariosSubject.value.some(
      (u) => u.email.toLowerCase() === usuario.email.toLowerCase(),
    );
    if (emailExiste) return 'Já existe um usuário com este e-mail.';
    return null;
  }

  private validarEdicao(usuario: Usuario): string | null {
    if (!usuario.nome?.trim()) return 'Nome é obrigatório.';
    if (!/^\S+@\S+\.\S+$/.test(usuario.email)) return 'E-mail inválido.';
    const emailExiste = this.usuariosSubject.value.some(
      (u) => u.id !== usuario.id && u.email.toLowerCase() === usuario.email.toLowerCase(),
    );
    if (emailExiste) return 'Já existe um usuário com este e-mail.';
    return null;
  }

  private proximoId(): number {
    const ids = this.usuariosSubject.value.map((u) => u.id);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }
}
