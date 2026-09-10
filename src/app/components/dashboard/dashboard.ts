import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { combineLatest, map } from 'rxjs';
import { ProdutoService } from '../../services/produto.service';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly produtoService = inject(ProdutoService);
  private readonly usuarioService = inject(UsuarioService);

  // combineLatest agrega dois streams independentes em uma única visão do dashboard
  readonly resumo$ = combineLatest([
    this.produtoService.estatisticas$,
    this.usuarioService.estatisticas$,
  ]).pipe(
    map(([produtos, usuarios]) => ({ produtos, usuarios })),
  );

  readonly carregandoProdutos$ = this.produtoService.carregando$;
  readonly carregandoUsuarios$ = this.usuarioService.carregando$;
}
