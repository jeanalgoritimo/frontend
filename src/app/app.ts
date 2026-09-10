import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './components/navbar/navbar';
import { Sidebar } from './components/sidebar/sidebar';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, Navbar, Sidebar],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('frontend');

  // Controla a visibilidade do menu lateral retrátil
  protected readonly sidebarAberta = signal(true);

  alternarSidebar(): void {
    this.sidebarAberta.update((aberta) => !aberta);
  }

  fecharSidebar(): void {
    this.sidebarAberta.set(false);
  }
}
