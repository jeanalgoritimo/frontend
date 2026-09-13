import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../../navbar/navbar';
import { Sidebar } from '../../sidebar/sidebar';
import { Toast } from '../../shared/toast/toast';

/** Layout administrativo (navbar + sidebar + toast) usado pelas rotas protegidas. */
@Component({
  selector: 'app-admin-layout',
  imports: [CommonModule, RouterOutlet, Navbar, Sidebar, Toast],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
})
export class AdminLayout {
  // Controla a visibilidade do menu lateral retrátil (fechado por padrão em telas estreitas)
  protected readonly sidebarAberta = signal(
    typeof window === 'undefined' || window.innerWidth >= 992,
  );

  alternarSidebar(): void {
    this.sidebarAberta.update((aberta) => !aberta);
  }

  fecharSidebar(): void {
    this.sidebarAberta.set(false);
  }
}
