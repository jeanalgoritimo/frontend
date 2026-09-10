import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Categoria } from '../../../models/categoria.model';
import { CategoriaService } from '../../../services/categoria.service';
import { NotificacaoService } from '../../../services/notificacao.service';
import { ConfirmModal } from '../../shared/confirm-modal/confirm-modal';

@Component({
  selector: 'app-categoria',
  imports: [CommonModule, FormsModule, ConfirmModal],
  templateUrl: './categoria.html',
  styleUrl: './categoria.scss',
})
export class CategoriaPage {
  private readonly categoriaService = inject(CategoriaService);
  private readonly notificacaoService = inject(NotificacaoService);

  readonly categorias$ = this.categoriaService.categoriasFiltradas$;
  readonly carregando$ = this.categoriaService.carregando$;

  termoBusca = '';
  mensagemErro: string | null = null;

  nomeForm = '';
  modalAberto = false;
  modoEdicao = false;
  editandoId: number | null = null;

  categoriaParaExcluir: Categoria | null = null;

  onBuscar(): void {
    this.categoriaService.buscar(this.termoBusca);
  }

  abrirModalNovo(): void {
    this.mensagemErro = null;
    this.modoEdicao = false;
    this.editandoId = null;
    this.nomeForm = '';
    this.modalAberto = true;
  }

  abrirModalEdicao(categoria: Categoria): void {
    this.mensagemErro = null;
    this.modoEdicao = true;
    this.editandoId = categoria.id;
    this.nomeForm = categoria.nome;
    this.modalAberto = true;
  }

  fecharModal(): void {
    this.modalAberto = false;
  }

  salvar(): void {
    this.mensagemErro = null;
    const operacao = this.modoEdicao
      ? this.categoriaService.atualizar(this.editandoId!, { nome: this.nomeForm })
      : this.categoriaService.adicionar(this.nomeForm);

    operacao.subscribe({
      next: () => {
        this.notificacaoService.sucesso(
          this.modoEdicao ? 'Categoria editada com sucesso!' : 'Categoria salva com sucesso!',
        );
        this.fecharModal();
      },
      error: (err: Error) => (this.mensagemErro = err.message),
    });
  }

  alternarAtiva(categoria: Categoria): void {
    this.categoriaService.atualizar(categoria.id, { ativa: !categoria.ativa }).subscribe();
  }

  abrirConfirmExclusao(categoria: Categoria): void {
    this.mensagemErro = null;
    this.categoriaParaExcluir = categoria;
  }

  cancelarExclusao(): void {
    this.categoriaParaExcluir = null;
  }

  confirmarExclusao(): void {
    if (!this.categoriaParaExcluir) return;
    this.categoriaService.remover(this.categoriaParaExcluir.id).subscribe({
      next: () => this.notificacaoService.sucesso('Categoria removida com sucesso!'),
      error: (err: Error) => this.notificacaoService.erro(err.message),
    });
    this.categoriaParaExcluir = null;
  }
}
