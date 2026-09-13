import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { combineLatest, map } from 'rxjs';
import { ProdutoService } from '../../services/produto.service';
import { UsuarioService } from '../../services/usuario.service';
import { MovimentacaoEstoqueService } from '../../services/movimentacao-estoque.service';
import { ReservaEstoqueService } from '../../services/reserva-estoque.service';
import { DepositoService } from '../../services/deposito.service';
import { AtividadeService } from '../../services/atividade.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly produtoService = inject(ProdutoService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly movimentacaoService = inject(MovimentacaoEstoqueService);
  private readonly reservaService = inject(ReservaEstoqueService);
  private readonly depositoService = inject(DepositoService);
  private readonly atividadeService = inject(AtividadeService);

  // combineLatest agrega streams independentes em uma única visão do dashboard
  readonly resumo$ = combineLatest([
    this.produtoService.estatisticas$,
    this.usuarioService.estatisticas$,
    this.movimentacaoService.movimentacoes$,
    this.reservaService.reservas$,
    this.depositoService.depositosAtivos$,
  ]).pipe(
    map(([produtos, usuarios, movimentacoes, reservas, depositosAtivos]) => ({
      produtos,
      usuarios,
      estoque: {
        totalMovimentacoes: movimentacoes.length,
        reservasAtivas: reservas.filter((r) => r.status === 'ativa').length,
        depositosAtivos: depositosAtivos.length,
      },
    })),
  );

  readonly ultimasAtividades$ = this.atividadeService.ultimasAtividades$(5);

  readonly carregandoProdutos$ = this.produtoService.carregando$;
  readonly carregandoUsuarios$ = this.usuarioService.carregando$;
}
