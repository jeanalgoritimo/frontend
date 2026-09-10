import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Produto as ProdutoModel } from '../../../models/produto.model';
import { ProdutoService } from '../../../services/produto.service';
import { CategoriaService } from '../../../services/categoria.service';
import { NotificacaoService } from '../../../services/notificacao.service';
import { ConfirmModal } from '../../shared/confirm-modal/confirm-modal';

@Component({
  selector: 'app-produto',
  imports: [CommonModule, FormsModule, ConfirmModal],
  templateUrl: './produto.html',
  styleUrl: './produto.scss',
})
export class Produto {
  private readonly produtoService = inject(ProdutoService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly notificacaoService = inject(NotificacaoService);

  // Streams expostos ao template via async pipe (sem subscribe manual)
  readonly produtos$ = this.produtoService.produtosFiltrados$;
  readonly estatisticas$ = this.produtoService.estatisticas$;
  readonly carregando$ = this.produtoService.carregando$;
  readonly erro$ = this.produtoService.erro$;

  // Alimenta o combobox de categoria no formulário de produto
  readonly categoriasAtivas$ = this.categoriaService.categoriasAtivas$;

  termoBusca = '';
  mensagemErro: string | null = null;

  private readonly produtoVazio = { nome: '', categoria: '', preco: 0, estoque: 0, ativo: true };
  formProduto = { ...this.produtoVazio };

  modalAberto = false;
  modoEdicao = false;
  editandoId: number | null = null;

  produtoParaExcluir: ProdutoModel | null = null;

  onBuscar(): void {
    this.produtoService.buscar(this.termoBusca);
  }

  abrirModalNovo(): void {
    this.mensagemErro = null;
    this.modoEdicao = false;
    this.editandoId = null;
    this.formProduto = { ...this.produtoVazio };
    this.modalAberto = true;
  }

  abrirModalEdicao(produto: ProdutoModel): void {
    this.mensagemErro = null;
    this.modoEdicao = true;
    this.editandoId = produto.id;
    this.formProduto = { ...produto };
    this.modalAberto = true;
  }

  fecharModal(): void {
    this.modalAberto = false;
  }

  salvar(): void {
    this.mensagemErro = null;
    const operacao = this.modoEdicao
      ? this.produtoService.atualizar(this.editandoId!, this.formProduto)
      : this.produtoService.adicionar(this.formProduto);

    operacao.subscribe({
      next: () => {
        this.notificacaoService.sucesso(
          this.modoEdicao ? 'Produto editado com sucesso!' : 'Produto salvo com sucesso!',
        );
        this.fecharModal();
      },
      error: (err: Error) => (this.mensagemErro = err.message),
    });
  }

  abrirConfirmExclusao(produto: ProdutoModel): void {
    this.produtoParaExcluir = produto;
  }

  cancelarExclusao(): void {
    this.produtoParaExcluir = null;
  }

  confirmarExclusao(): void {
    if (!this.produtoParaExcluir) return;
    this.produtoService.remover(this.produtoParaExcluir.id).subscribe();
    this.produtoParaExcluir = null;
  }
}
