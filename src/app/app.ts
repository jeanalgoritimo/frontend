import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Casca raiz da aplicação: apenas delega para a rota ativa (login ou layout administrativo). */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {}
