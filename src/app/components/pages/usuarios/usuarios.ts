import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Usuario as UsuarioModel } from '../../../models/usuario.model';
import { UsuarioService } from '../../../services/usuario.service';

@Component({
  selector: 'app-usuarios',
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss',
})
export class Usuarios {
  private readonly usuarioService = inject(UsuarioService);

  readonly usuarios$ = this.usuarioService.usuariosFiltrados$;
  readonly estatisticas$ = this.usuarioService.estatisticas$;
  readonly carregando$ = this.usuarioService.carregando$;

  termoBusca = '';
  mensagemErro: string | null = null;

  novoUsuario: Omit<UsuarioModel, 'id'> = { nome: '', email: '', perfil: 'usuario', ativo: true };

  onBuscar(): void {
    this.usuarioService.buscar(this.termoBusca);
  }

  adicionar(): void {
    this.mensagemErro = null;
    this.usuarioService.adicionar(this.novoUsuario).subscribe({
      next: () => (this.novoUsuario = { nome: '', email: '', perfil: 'usuario', ativo: true }),
      error: (err: Error) => (this.mensagemErro = err.message),
    });
  }

  alternarAtivo(id: number): void {
    this.mensagemErro = null;
    this.usuarioService.alternarAtivo(id).subscribe({
      error: (err: Error) => (this.mensagemErro = err.message),
    });
  }

  remover(id: number): void {
    this.mensagemErro = null;
    this.usuarioService.remover(id).subscribe({
      error: (err: Error) => (this.mensagemErro = err.message),
    });
  }
}
