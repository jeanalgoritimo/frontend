import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TemaService } from '../../services/tema.service';
import { GestaoService } from '../../services/gestao.service';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly temaService = inject(TemaService);
  readonly alertas$ = inject(GestaoService).alertasNaoLidos$();

  @Output() alternarMenu = new EventEmitter<void>();

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  alternarTema(): void { this.temaService.alternarTema(); }
}
