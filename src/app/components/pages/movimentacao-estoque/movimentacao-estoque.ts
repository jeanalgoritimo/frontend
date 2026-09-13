import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MovimentacaoEstoque, NovaMovimentacaoEstoque, TipoMovimentacaoEstoque } from '../../../models/movimentacao-estoque.model';
import { MovimentacaoEstoqueService } from '../../../services/movimentacao-estoque.service';
import { ProdutoService } from '../../../services/produto.service';
import { DepositoService } from '../../../services/deposito.service';
import { NotificacaoService } from '../../../services/notificacao.service';
import { ConfirmModal } from '../../shared/confirm-modal/confirm-modal';

const TIPOS_COM_ORIGEM: TipoMovimentacaoEstoque[] = ['saida', 'ajuste-negativo', 'transferencia', 'devolucao'];
const TIPOS_COM_DESTINO: TipoMovimentacaoEstoque[] = ['entrada', 'ajuste-positivo', 'transferencia'];

@Component({
  selector: 'app-movimentacao-estoque',
  imports: [CommonModule, FormsModule, ConfirmModal],
  templateUrl: './movimentacao-estoque.html',
  styleUrl: './movimentacao-estoque.scss',
})
export class MovimentacaoEstoquePage {
  private readonly movimentacaoService = inject(MovimentacaoEstoqueService);
  private readonly notificacaoService = inject(NotificacaoService);

  readonly produtoService = inject(ProdutoService);
  readonly depositoService = inject(DepositoService);

  readonly movimentacoes$ = this.movimentacaoService.movimentacoesFiltradas$;
  readonly carregando$ = this.movimentacaoService.carregando$;
  readonly produtos$ = this.produtoService.produtos$;
  readonly depositosAtivos$ = this.depositoService.depositosAtivos$;

  termoBusca = '';
  mensagemErro: string | null = null;
  modalAberto = false;

  private readonly formVazio: NovaMovimentacaoEstoque = {
    produtoId: 0,
    tipo: 'entrada',
    quantidade: 1,
    depositoOrigemId: null,
    depositoDestinoId: null,
    localizacaoOrigemId: null,
    localizacaoDestinoId: null,
    // Demonstração: em um cenário real, o usuário responsável viria da sessão autenticada.
    usuarioResponsavel: 'admin',
    documentoReferencia: '',
    custoUnitario: 0,
    observacao: '',
  };
  form: NovaMovimentacaoEstoque = { ...this.formVazio };

  movimentacaoParaCancelar: MovimentacaoEstoque | null = null;

  onBuscar(): void {
    this.movimentacaoService.buscar(this.termoBusca);
  }

  precisaOrigem(): boolean {
    return TIPOS_COM_ORIGEM.includes(this.form.tipo);
  }

  precisaDestino(): boolean {
    return TIPOS_COM_DESTINO.includes(this.form.tipo);
  }

  abrirModalNovo(): void {
    this.mensagemErro = null;
    this.form = { ...this.formVazio };
    this.modalAberto = true;
  }

  fecharModal(): void {
    this.modalAberto = false;
  }

  salvar(): void {
    this.mensagemErro = null;
    this.movimentacaoService.registrar(this.form).subscribe({
      next: () => {
        this.notificacaoService.sucesso('Movimentação registrada com sucesso!');
        this.fecharModal();
      },
      error: (err: Error) => (this.mensagemErro = err.message),
    });
  }

  abrirConfirmCancelamento(movimentacao: MovimentacaoEstoque): void {
    this.mensagemErro = null;
    this.movimentacaoParaCancelar = movimentacao;
  }

  cancelarConfirmacao(): void {
    this.movimentacaoParaCancelar = null;
  }

  confirmarCancelamento(): void {
    if (!this.movimentacaoParaCancelar) return;
    this.movimentacaoService.cancelar(this.movimentacaoParaCancelar.id, 'admin').subscribe({
      next: () => this.notificacaoService.sucesso('Movimentação cancelada (estorno registrado).'),
      error: (err: Error) => this.notificacaoService.erro(err.message),
    });
    this.movimentacaoParaCancelar = null;
  }

  nomeProduto(produtoId: number): string {
    return this.produtoService.produtosAtuais().find((p) => p.id === produtoId)?.nome ?? '—';
  }

  nomeDeposito(depositoId: number | null): string {
    if (depositoId == null) return '—';
    return this.depositoService.depositosAtuais().find((d) => d.id === depositoId)?.nome ?? '—';
  }
}
