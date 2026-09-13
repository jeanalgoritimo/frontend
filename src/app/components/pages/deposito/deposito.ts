import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Deposito } from '../../../models/deposito.model';
import { DepositoService } from '../../../services/deposito.service';
import { NotificacaoService } from '../../../services/notificacao.service';
import { ConfirmModal } from '../../shared/confirm-modal/confirm-modal';

@Component({
  selector: 'app-deposito',
  imports: [CommonModule, FormsModule, ConfirmModal],
  templateUrl: './deposito.html',
  styleUrl: './deposito.scss',
})
export class DepositoPage {
  private readonly depositoService = inject(DepositoService);
  private readonly notificacaoService = inject(NotificacaoService);

  readonly depositos$ = this.depositoService.depositosFiltrados$;
  readonly carregando$ = this.depositoService.carregando$;

  termoBusca = '';
  mensagemErro: string | null = null;

  private readonly depositoVazio: Omit<Deposito, 'id'> = {
    codigo: '',
    nome: '',
    descricao: '',
    endereco: '',
    responsavel: '',
    ativo: true,
  };
  formDeposito: Omit<Deposito, 'id'> = { ...this.depositoVazio };

  modalAberto = false;
  modoEdicao = false;
  editandoId: number | null = null;

  depositoParaExcluir: Deposito | null = null;

  onBuscar(): void {
    this.depositoService.buscar(this.termoBusca);
  }

  abrirModalNovo(): void {
    this.mensagemErro = null;
    this.modoEdicao = false;
    this.editandoId = null;
    this.formDeposito = { ...this.depositoVazio };
    this.modalAberto = true;
  }

  abrirModalEdicao(deposito: Deposito): void {
    this.mensagemErro = null;
    this.modoEdicao = true;
    this.editandoId = deposito.id;
    this.formDeposito = { ...deposito };
    this.modalAberto = true;
  }

  fecharModal(): void {
    this.modalAberto = false;
  }

  salvar(): void {
    this.mensagemErro = null;
    const operacao = this.modoEdicao
      ? this.depositoService.atualizar(this.editandoId!, this.formDeposito)
      : this.depositoService.adicionar(this.formDeposito);

    operacao.subscribe({
      next: () => {
        this.notificacaoService.sucesso(
          this.modoEdicao ? 'Depósito editado com sucesso!' : 'Depósito salvo com sucesso!',
        );
        this.fecharModal();
      },
      error: (err: Error) => (this.mensagemErro = err.message),
    });
  }

  alternarAtivo(deposito: Deposito): void {
    this.depositoService.atualizar(deposito.id, { ativo: !deposito.ativo }).subscribe();
  }

  abrirConfirmExclusao(deposito: Deposito): void {
    this.mensagemErro = null;
    this.depositoParaExcluir = deposito;
  }

  cancelarExclusao(): void {
    this.depositoParaExcluir = null;
  }

  confirmarExclusao(): void {
    if (!this.depositoParaExcluir) return;
    this.depositoService.remover(this.depositoParaExcluir.id).subscribe({
      next: () => this.notificacaoService.sucesso('Depósito removido com sucesso!'),
      error: (err: Error) => this.notificacaoService.erro(err.message),
    });
    this.depositoParaExcluir = null;
  }
}
