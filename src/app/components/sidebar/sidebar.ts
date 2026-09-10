import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  host: {
    '[class.aberta]': 'aberta',
  },
})
export class Sidebar {
  @Input() aberta = true;
  @Output() fechar = new EventEmitter<void>();
}

