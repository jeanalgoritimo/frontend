import { Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Notificacao, NotificacaoService } from '../../../services/notificacao.service';

@Component({
  selector: 'app-toast',
  imports: [CommonModule],
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
})
export class Toast {
  private readonly notificacaoService = inject(NotificacaoService);
  private readonly destroyRef = inject(DestroyRef);
  private proximoId = 0;

  notificacoes: (Notificacao & { id: number })[] = [];

  constructor() {
    this.notificacaoService.notificacao$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((notificacao) => {
      const id = this.proximoId++;
      this.notificacoes = [...this.notificacoes, { ...notificacao, id }];
      setTimeout(() => this.remover(id), 3500);
    });
  }

  remover(id: number): void {
    this.notificacoes = this.notificacoes.filter((n) => n.id !== id);
  }
}
