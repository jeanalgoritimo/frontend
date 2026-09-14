import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BehaviorSubject, combineLatest, delay, finalize, map, of } from 'rxjs';
import { AtividadeService } from '../../services/atividade.service';
import { CategoriaService } from '../../services/categoria.service';
import { DepositoService } from '../../services/deposito.service';
import { GestaoService } from '../../services/gestao.service';
import { MovimentacaoEstoqueService } from '../../services/movimentacao-estoque.service';
import { NotificacaoService } from '../../services/notificacao.service';
import { ProdutoService } from '../../services/produto.service';
import { ReservaEstoqueService } from '../../services/reserva-estoque.service';
import { UsuarioService } from '../../services/usuario.service';

@Component({ selector: 'app-dashboard', imports: [CommonModule, RouterLink], templateUrl: './dashboard.html', styleUrl: './dashboard.scss' })
export class Dashboard {
  private readonly produtoService = inject(ProdutoService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly movimentacaoService = inject(MovimentacaoEstoqueService);
  private readonly reservaService = inject(ReservaEstoqueService);
  private readonly depositoService = inject(DepositoService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly atividadeService = inject(AtividadeService);
  private readonly gestaoService = inject(GestaoService);
  private readonly notificacao = inject(NotificacaoService);
  private readonly atualizandoSubject = new BehaviorSubject(false);
  readonly atualizando$ = this.atualizandoSubject.asObservable();
  ultimaAtualizacao = new Date();
  readonly hoje = new Date();

  readonly vm$ = combineLatest([
    this.produtoService.produtos$, this.produtoService.estatisticas$, this.usuarioService.estatisticas$,
    this.movimentacaoService.movimentacoes$, this.reservaService.reservas$, this.depositoService.depositosAtivos$,
    this.categoriaService.categorias$, this.gestaoService.registros$('alertas'),
    this.gestaoService.registros$('pedidos'), this.gestaoService.registros$('solicitacoes'),
  ]).pipe(map(([produtos, produtoStats, usuarioStats, movimentacoes, reservas, depositos, categorias, alertas, pedidos, solicitacoes]) => {
    const estoqueBaixo = produtos.filter((p) => p.estoque < 5).sort((a, b) => a.estoque - b.estoque);
    const totalUnidades = produtos.reduce((s, p) => s + p.estoque, 0);
    const categoriasResumo = categorias.map((categoria) => {
      const itens = produtos.filter((p) => p.categoria === categoria.nome);
      const valor = itens.reduce((s, p) => s + p.preco * p.estoque, 0);
      return { nome: categoria.nome, unidades: itens.reduce((s, p) => s + p.estoque, 0), valor,
        percentual: produtoStats.valorTotalEstoque ? Math.round(valor / produtoStats.valorTotalEstoque * 100) : 0 };
    });
    return {
      produtos: produtoStats, usuarios: usuarioStats, estoqueBaixo, categoriasResumo, totalUnidades,
      semEstoque: produtos.filter((p) => p.estoque === 0).length,
      coberturaDias: totalUnidades ? Math.round(totalUnidades / 0.8) : 0,
      movimentacoes: movimentacoes.length, reservasAtivas: reservas.filter((r) => r.status === 'ativa').length,
      depositosAtivos: depositos.length, alertasNaoLidos: alertas.filter((a) => a.status === 'Não lido').length,
      alertas: alertas.slice(0, 4), pedidosAtrasados: pedidos.filter((p) => /parcial|atrasado/i.test(p.status)).length,
      aprovacoes: solicitacoes.filter((s) => s.status === 'Aguardando aprovação').length,
    };
  }));

  readonly ultimasAtividades$ = this.atividadeService.ultimasAtividades$(6);

  atualizar(): void {
    this.atualizandoSubject.next(true);
    of(true).pipe(delay(650), finalize(() => this.atualizandoSubject.next(false))).subscribe(() => {
      this.ultimaAtualizacao = new Date();
      this.atividadeService.registrar({ usuario: 'admin', entidade: 'dashboard', entidadeId: 'principal', acao: 'alteracao', descricao: 'Dashboard atualizado manualmente.' });
      this.notificacao.sucesso('Indicadores atualizados com sucesso.');
    });
  }
}
