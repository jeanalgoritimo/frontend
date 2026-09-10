import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { Produto as ProdutoModel } from '../../../models/produto.model';
import { ProdutoService } from '../../../services/produto.service';

@Component({
  selector: 'app-produto',
  imports: [CommonModule, FormsModule],
  templateUrl: './produto.html',
  styleUrl: './produto.scss',
})
export class Produto {
  private readonly produtoService = inject(ProdutoService);

  // Streams expostos ao template via async pipe (sem subscribe manual)
  readonly produtos$ = this.produtoService.produtosFiltrados$;
  readonly estatisticas$ = this.produtoService.estatisticas$;
  readonly carregando$ = this.produtoService.carregando$;
  readonly erro$ = this.produtoService.erro$;

  termoBusca = '';
  mensagemErro: string | null = null;

  novoProduto = { nome: '', categoria: '', preco: 0, estoque: 0, ativo: true };
  editandoId: number | null = null;

  onBuscar(): void {
    this.produtoService.buscar(this.termoBusca);
  }

  adicionar(): void {
    this.mensagemErro = null;
    this.produtoService.adicionar(this.novoProduto).subscribe({
      next: () => {
        this.novoProduto = { nome: '', categoria: '', preco: 0, estoque: 0, ativo: true };
      },
      error: (err: Error) => (this.mensagemErro = err.message),
    });
  }

  editar(produto: ProdutoModel): void {
    this.editandoId = produto.id;
  }

  salvarEdicao(produto: ProdutoModel): void {
    this.mensagemErro = null;
    this.produtoService.atualizar(produto.id, produto).subscribe({
      next: () => (this.editandoId = null),
      error: (err: Error) => (this.mensagemErro = err.message),
    });
  }

  cancelarEdicao(): void {
    this.editandoId = null;
  }

  remover(id: number): void {
    this.produtoService.remover(id).subscribe();
  }
}
