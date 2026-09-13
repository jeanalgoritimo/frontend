import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Localizacao } from '../../../models/localizacao.model';
import { LocalizacaoService } from '../../../services/localizacao.service';
import { DepositoService } from '../../../services/deposito.service';
import { NotificacaoService } from '../../../services/notificacao.service';
import { ConfirmModal } from '../../shared/confirm-modal/confirm-modal';

@Component({
  selector: 'app-localizacao',
  imports: [CommonModule, FormsModule, ConfirmModal],
  templateUrl: './localizacao.html',
  styleUrl: './localizacao.scss',
})
export class LocalizacaoPage {
  private readonly localizacaoService = inject(LocalizacaoService);
  private readonly depositoService = inject(DepositoService);
  private readonly notificacaoService = inject(NotificacaoService);

  readonly localizacoes$ = this.localizacaoService.localizacoesFiltradas$;
  readonly depositos$ = this.depositoService.depositos$;
  readonly carregando$ = this.localizacaoService.carregando$;

  termoBusca = '';
  mensagemErro: string | null = null;

  private readonly localizacaoVazia: Omit<Localizacao, 'id'> = {
    depositoId: 0,
    corredor: '',
    prateleira: '',
    posicao: '',
    capacidade: 0,
    ocupacaoAtual: 0,
    ativa: true,
  };
  formLocalizacao: Omit<Localizacao, 'id'> = { ...this.localizacaoVazia };

  modalAberto = false;
  modoEdicao = false;
  editandoId: number | null = null;

  localizacaoParaExcluir: Localizacao | null = null;

  onBuscar(): void {
    this.localizacaoService.buscar(this.termoBusca);
  }

  abrirModalNovo(): void {
    this.mensagemErro = null;
    this.modoEdicao = false;
    this.editandoId = null;
    this.formLocalizacao = { ...this.localizacaoVazia };
    this.modalAberto = true;
  }

  abrirModalEdicao(localizacao: Localizacao): void {
    this.mensagemErro = null;
    this.modoEdicao = true;
    this.editandoId = localizacao.id;
    this.formLocalizacao = { ...localizacao };
    this.modalAberto = true;
  }

  fecharModal(): void {
    this.modalAberto = false;
  }

  salvar(): void {
    this.mensagemErro = null;
    const operacao = this.modoEdicao
      ? this.localizacaoService.atualizar(this.editandoId!, this.formLocalizacao)
      : this.localizacaoService.adicionar(this.formLocalizacao);

    operacao.subscribe({
      next: () => {
        this.notificacaoService.sucesso(
          this.modoEdicao ? 'Localização editada com sucesso!' : 'Localização salva com sucesso!',
        );
        this.fecharModal();
      },
      error: (err: Error) => (this.mensagemErro = err.message),
    });
  }

  abrirConfirmExclusao(localizacao: Localizacao): void {
    this.mensagemErro = null;
    this.localizacaoParaExcluir = localizacao;
  }

  cancelarExclusao(): void {
    this.localizacaoParaExcluir = null;
  }

  confirmarExclusao(): void {
    if (!this.localizacaoParaExcluir) return;
    this.localizacaoService.remover(this.localizacaoParaExcluir.id).subscribe({
      next: () => this.notificacaoService.sucesso('Localização removida com sucesso!'),
      error: (err: Error) => this.notificacaoService.erro(err.message),
    });
    this.localizacaoParaExcluir = null;
  }
}
