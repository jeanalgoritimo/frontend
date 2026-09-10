import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './components/navbar/navbar';
import { Sidebar } from './components/sidebar/sidebar';
import { Toast } from './components/shared/toast/toast';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, Navbar, Sidebar, Toast],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('frontend');

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
