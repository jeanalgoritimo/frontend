import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, combineLatest, map, switchMap } from 'rxjs';
import { ConfiguracaoModulo, ModuloGestao, RegistroGestao } from '../../../models/gestao.model';
import { GestaoService } from '../../../services/gestao.service';
import { NotificacaoService } from '../../../services/notificacao.service';

const CONFIGURACOES: Record<ModuloGestao, Omit<ConfiguracaoModulo, 'modulo'>> = {
  fornecedores: cfg('Fornecedores', 'Parceiros, preços, prazos e avaliação de fornecimento.', 'bi-truck', 'primary', 'Novo fornecedor', ['Ativo', 'Em análise', 'Inativo']),
  solicitacoes: cfg('Solicitações de compra', 'Demandas internas e fluxo de aprovação.', 'bi-file-earmark-check', 'warning', 'Nova solicitação', ['Rascunho', 'Aguardando aprovação', 'Aprovada', 'Rejeitada', 'Cancelada']),
  cotacoes: cfg('Cotações', 'Comparativo de propostas, preços, prazos e avaliação.', 'bi-calculator', 'info', 'Nova cotação', ['Rascunho', 'Em análise', 'Concluída', 'Cancelada']),
  pedidos: cfg('Pedidos de compra', 'Acompanhamento desde a emissão até o recebimento.', 'bi-cart-check', 'success', 'Novo pedido', ['Rascunho', 'Emitido', 'Confirmado', 'Parcialmente recebido', 'Recebido', 'Cancelado']),
  recebimentos: cfg('Recebimentos', 'Conferência física, fiscal e atualização do estoque.', 'bi-box-arrow-in-down', 'success', 'Novo recebimento', ['Pendente', 'Parcial', 'Concluído', 'Com divergência']),
  reposicao: cfg('Reposição inteligente', 'Estoque previsto, limites mínimo/máximo e sugestões de compra.', 'bi-arrow-repeat', 'danger', 'Nova regra', ['Regular', 'Comprar', 'Solicitado', 'Concluído']),
  inventarios: cfg('Inventários', 'Planejamento, contagem, conferência e ajustes.', 'bi-clipboard2-check', 'primary', 'Novo inventário', ['Planejado', 'Em contagem', 'Aguardando conferência', 'Aprovado', 'Encerrado', 'Cancelado']),
  contagem: cfg('Contagem cíclica', 'Acuracidade física por depósito e localização.', 'bi-upc-scan', 'primary', 'Nova contagem', ['Planejada', 'Em contagem', 'Aguardando conferência', 'Conferida', 'Ajustada']),
  lotes: cfg('Lotes e validade', 'Rastreabilidade, vencimentos e recolhimentos.', 'bi-boxes', 'warning', 'Novo lote', ['Disponível', 'Bloqueado', 'Próximo do vencimento', 'Vencido', 'Recolhido']),
  series: cfg('Números de série', 'Rastreamento individual do ciclo de vida do item.', 'bi-qr-code', 'secondary', 'Nova série', ['Em estoque', 'Reservado', 'Em uso', 'Devolvido', 'Baixado']),
  leitura: cfg('Leitura de códigos', 'Operação rápida por EAN, Code 128, QR Code ou GS1.', 'bi-upc', 'dark', 'Nova leitura', ['Aguardando', 'Processada', 'Rejeitada']),
  devolucoes: cfg('Devoluções', 'Retorno interno, avarias e devoluções ao fornecedor.', 'bi-arrow-counterclockwise', 'warning', 'Nova devolução', ['Rascunho', 'Aguardando coleta', 'Em trânsito', 'Concluída', 'Cancelada']),
  valorizacao: cfg('Valorização do estoque', 'Custo médio e valor financeiro por categoria e depósito.', 'bi-currency-dollar', 'success', 'Recalcular', ['Atualizado', 'Pendente', 'Divergente']),
  demanda: cfg('Previsão de demanda', 'Média móvel, cobertura e risco de ruptura.', 'bi-graph-up-arrow', 'info', 'Nova simulação', ['Regular', 'Risco de ruptura', 'Excesso', 'Revisar']),
  'curva-abc': cfg('Curva ABC', 'Priorização de produtos por impacto financeiro.', 'bi-pie-chart', 'primary', 'Recalcular curva', ['Classe A', 'Classe B', 'Classe C']),
  relatorios: cfg('Relatórios gerenciais', 'Indicadores de estoque, compras, cobertura e fornecedores.', 'bi-file-earmark-bar-graph', 'secondary', 'Novo relatório', ['Disponível', 'Processando', 'Com erro']),
  auditoria: cfg('Auditoria', 'Histórico imutável das operações realizadas.', 'bi-shield-check', 'dark', 'Atualizar consulta', ['Sucesso', 'Falha', 'Alerta']),
  perfis: cfg('Perfis e permissões', 'Acesso por função e ações autorizadas.', 'bi-person-lock', 'primary', 'Novo perfil', ['Ativo', 'Inativo', 'Em revisão']),
  configuracoes: cfg('Configurações', 'Parâmetros corporativos e regras do sistema.', 'bi-gear', 'secondary', 'Nova configuração', ['Ativa', 'Inativa', 'BRL']),
  alertas: cfg('Central de alertas', 'Rupturas, vencimentos, divergências e aprovações.', 'bi-bell', 'danger', 'Atualizar alertas', ['Não lido', 'Lido', 'Resolvido']),
};

function cfg(titulo: string, subtitulo: string, icone: string, cor: string, rotuloNovo: string, status: string[]): Omit<ConfiguracaoModulo, 'modulo'> {
  return { titulo, subtitulo, icone, cor, rotuloNovo, status, colunas: [
    { chave: 'codigo', titulo: 'Código' }, { chave: 'titulo', titulo: 'Descrição' },
    { chave: 'status', titulo: 'Status' }, { chave: 'quantidade', titulo: 'Qtd.' },
    { chave: 'valor', titulo: 'Valor', formato: 'moeda' }, { chave: 'responsavel', titulo: 'Responsável' },
    { chave: 'data', titulo: 'Data', formato: 'data' },
  ] };
}

@Component({
  selector: 'app-gestao-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './gestao.html',
  styleUrl: './gestao.scss',
})
export class GestaoPage {
  private readonly route = inject(ActivatedRoute);
  private readonly gestaoService = inject(GestaoService);
  private readonly notificacao = inject(NotificacaoService);
  private readonly buscaSubject = new BehaviorSubject('');
  private readonly statusSubject = new BehaviorSubject('');

  readonly modulo$ = this.route.data.pipe(map((data) => data['modulo'] as ModuloGestao));
  readonly config$ = this.modulo$.pipe(map((modulo) => ({ modulo, ...CONFIGURACOES[modulo] })));
  readonly indicadores$ = this.modulo$.pipe(switchMap((modulo) => this.gestaoService.indicadores$(modulo)));
  readonly registros$ = this.modulo$.pipe(switchMap((modulo) => combineLatest([
    this.gestaoService.registros$(modulo), this.buscaSubject, this.statusSubject,
  ]).pipe(map(([registros, busca, status]) => registros.filter((item) => {
    const termo = busca.trim().toLowerCase();
    const corresponde = !termo || `${item.codigo} ${item.titulo} ${item.descricao} ${item.responsavel}`.toLowerCase().includes(termo);
    return corresponde && (!status || item.status === status);
  })))));

  selecionado: RegistroGestao | null = null;
  processando = false;

  buscar(valor: string): void { this.buscaSubject.next(valor); }
  filtrarStatus(valor: string): void { this.statusSubject.next(valor); }

  adicionar(config: ConfiguracaoModulo): void {
    this.processando = true;
    this.gestaoService.adicionarDemonstracao(config.modulo).subscribe({
      next: () => this.notificacao.sucesso(`${config.rotuloNovo} incluído para demonstração.`),
      error: (erro: Error) => this.notificacao.erro(erro.message),
      complete: () => this.processando = false,
    });
  }

  alterarStatus(config: ConfiguracaoModulo, item: RegistroGestao, status: string): void {
    if (!status || status === item.status) return;
    this.gestaoService.atualizarStatus(config.modulo, item.id, status).subscribe({
      next: () => this.notificacao.sucesso('Status atualizado com sucesso.'),
      error: (erro: Error) => this.notificacao.erro(erro.message),
    });
  }

  marcarAlertas(config: ConfiguracaoModulo): void {
    if (config.modulo !== 'alertas') return;
    this.gestaoService.marcarAlertasComoLidos();
    this.notificacao.sucesso('Todos os alertas foram marcados como lidos.');
  }

  exportar(config: ConfiguracaoModulo, registros: RegistroGestao[]): void {
    const cabecalho = ['Código', 'Descrição', 'Status', 'Quantidade', 'Valor', 'Responsável', 'Data'];
    const linhas = registros.map((x) => [x.codigo, x.titulo, x.status, x.quantidade, x.valor, x.responsavel, x.data.toLocaleDateString('pt-BR')]);
    const csv = [cabecalho, ...linhas].map((linha) => linha.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(';')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    link.download = `${config.modulo}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  badge(status: string): string {
    if (/vencido|rejeit|cancel|ruptura|sem estoque|falha/i.test(status)) return 'danger';
    if (/aprov|conclu|recebido|ativo|disponível|sucesso|regular|conferida/i.test(status)) return 'success';
    if (/aguard|análise|parcial|comprar|próximo|contagem/i.test(status)) return 'warning';
    return 'secondary';
  }
}
