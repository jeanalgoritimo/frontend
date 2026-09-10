import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Modal de confirmação reutilizável com botões Sim/Não (usado para exclusões). */
@Component({
  selector: 'app-confirm-modal',
  imports: [CommonModule],
  templateUrl: './confirm-modal.html',
  styleUrl: './confirm-modal.scss',
})
export class ConfirmModal {
  @Input() aberto = false;
  @Input() titulo = 'Confirmar exclusão';
  @Input() mensagem = 'Deseja excluir este item?';

  @Output() confirmar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();
}
