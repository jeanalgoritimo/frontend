import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Usuario as UsuarioModel } from '../../../models/usuario.model';
import { UsuarioService } from '../../../services/usuario.service';
import { NotificacaoService } from '../../../services/notificacao.service';
import { ConfirmModal } from '../../shared/confirm-modal/confirm-modal';

@Component({
  selector: 'app-usuarios',
  imports: [CommonModule, FormsModule, ConfirmModal],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss',
})
export class Usuarios {
  private readonly usuarioService = inject(UsuarioService);
  private readonly notificacaoService = inject(NotificacaoService);

  readonly usuarios$ = this.usuarioService.usuariosFiltrados$;
  readonly estatisticas$ = this.usuarioService.estatisticas$;
  readonly carregando$ = this.usuarioService.carregando$;

  termoBusca = '';
  mensagemErro: string | null = null;

  private readonly usuarioVazio: Omit<UsuarioModel, 'id'> = {
    nome: '',
    email: '',
    perfil: 'usuario',
    ativo: true,
  };
  formUsuario: Omit<UsuarioModel, 'id'> = { ...this.usuarioVazio };

  modalAberto = false;
  modoEdicao = false;
  editandoId: number | null = null;

  usuarioParaExcluir: UsuarioModel | null = null;

  onBuscar(): void {
    this.usuarioService.buscar(this.termoBusca);
  }

  abrirModalNovo(): void {
    this.mensagemErro = null;
    this.modoEdicao = false;
    this.editandoId = null;
    this.formUsuario = { ...this.usuarioVazio };
    this.modalAberto = true;
  }

  abrirModalEdicao(usuario: UsuarioModel): void {
    this.mensagemErro = null;
    this.modoEdicao = true;
    this.editandoId = usuario.id;
    this.formUsuario = { nome: usuario.nome, email: usuario.email, perfil: usuario.perfil, ativo: usuario.ativo };
    this.modalAberto = true;
  }

  fecharModal(): void {
    this.modalAberto = false;
  }

  salvar(): void {
    this.mensagemErro = null;
    const operacao = this.modoEdicao
      ? this.usuarioService.atualizar(this.editandoId!, this.formUsuario)
      : this.usuarioService.adicionar(this.formUsuario);

    operacao.subscribe({
      next: () => {
        this.notificacaoService.sucesso(
          this.modoEdicao ? 'Usuário editado com sucesso!' : 'Usuário salvo com sucesso!',
        );
        this.fecharModal();
      },
      error: (err: Error) => (this.mensagemErro = err.message),
    });
  }

  alternarAtivo(id: number): void {
    this.mensagemErro = null;
    this.usuarioService.alternarAtivo(id).subscribe({
      error: (err: Error) => (this.mensagemErro = err.message),
    });
  }

  abrirConfirmExclusao(usuario: UsuarioModel): void {
    this.mensagemErro = null;
    this.usuarioParaExcluir = usuario;
  }

  cancelarExclusao(): void {
    this.usuarioParaExcluir = null;
  }

  confirmarExclusao(): void {
    if (!this.usuarioParaExcluir) return;
    this.usuarioService.remover(this.usuarioParaExcluir.id).subscribe({
      error: (err: Error) => (this.mensagemErro = err.message),
    });
    this.usuarioParaExcluir = null;
  }
}
