import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservaEstoque, NovaReservaEstoque } from '../../../models/reserva-estoque.model';
import { ReservaEstoqueService } from '../../../services/reserva-estoque.service';
import { ProdutoService } from '../../../services/produto.service';
import { NotificacaoService } from '../../../services/notificacao.service';
import { ConfirmModal } from '../../shared/confirm-modal/confirm-modal';

@Component({
  selector: 'app-reserva-estoque',
  imports: [CommonModule, FormsModule, ConfirmModal],
  templateUrl: './reserva-estoque.html',
  styleUrl: './reserva-estoque.scss',
})
export class ReservaEstoquePage implements OnInit {
  private readonly reservaService = inject(ReservaEstoqueService);
  private readonly notificacaoService = inject(NotificacaoService);

  readonly produtoService = inject(ProdutoService);

  readonly reservas$ = this.reservaService.reservasFiltradas$;
  readonly carregando$ = this.reservaService.carregando$;
  readonly produtos$ = this.produtoService.produtos$;
  readonly disponibilidade$ = this.reservaService.disponibilidadePorProduto$;

  termoBusca = '';
  mensagemErro: string | null = null;
  modalAberto = false;

  private readonly formVazio: NovaReservaEstoque = {
    produtoId: 0,
    quantidade: 1,
    // Demonstração: em um cenário real, o solicitante viria da sessão autenticada.
    solicitante: 'admin',
    finalidade: '',
    data: new Date(),
    validade: new Date(Date.now() + 7 * 86400000),
  };
  form: NovaReservaEstoque = { ...this.formVazio };
  validadeTexto = this.formatarData(this.formVazio.validade);

  reservaParaCancelar: ReservaEstoque | null = null;

  ngOnInit(): void {
    this.reservaService.sincronizarExpiracoes();
  }

  onBuscar(): void {
    this.reservaService.buscar(this.termoBusca);
  }

  abrirModalNovo(): void {
    this.mensagemErro = null;
    const validade = new Date(Date.now() + 7 * 86400000);
    this.form = { ...this.formVazio, data: new Date(), validade };
    this.validadeTexto = this.formatarData(validade);
    this.modalAberto = true;
  }

  fecharModal(): void {
    this.modalAberto = false;
  }

  salvar(): void {
    this.mensagemErro = null;
    const dto: NovaReservaEstoque = { ...this.form, validade: new Date(this.validadeTexto) };
    this.reservaService.criar(dto).subscribe({
      next: () => {
        this.notificacaoService.sucesso('Reserva criada com sucesso!');
        this.fecharModal();
      },
      error: (err: Error) => (this.mensagemErro = err.message),
    });
  }

  atender(reserva: ReservaEstoque): void {
    this.reservaService.atender(reserva.id).subscribe({
      next: () => this.notificacaoService.sucesso('Reserva atendida com sucesso!'),
      error: (err: Error) => this.notificacaoService.erro(err.message),
    });
  }

  abrirConfirmCancelamento(reserva: ReservaEstoque): void {
    this.mensagemErro = null;
    this.reservaParaCancelar = reserva;
  }

  cancelarConfirmacao(): void {
    this.reservaParaCancelar = null;
  }

  confirmarCancelamento(): void {
    if (!this.reservaParaCancelar) return;
    this.reservaService.cancelar(this.reservaParaCancelar.id).subscribe({
      next: () => this.notificacaoService.sucesso('Reserva cancelada com sucesso!'),
      error: (err: Error) => this.notificacaoService.erro(err.message),
    });
    this.reservaParaCancelar = null;
  }

  nomeProduto(produtoId: number): string {
    return this.produtoService.produtosAtuais().find((p) => p.id === produtoId)?.nome ?? '—';
  }

  private formatarData(data: Date): string {
    return data.toISOString().slice(0, 10);
  }
}
