import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, delay, map, of, tap, throwError } from 'rxjs';
import { IndicadoresGestao, ModuloGestao, RegistroGestao } from '../models/gestao.model';
import { AtividadeService } from './atividade.service';

const hoje = new Date();
const diasAtras = (dias: number) => new Date(hoje.getTime() - dias * 86400000);

function registro(id: number, codigo: string, titulo: string, status: string, valor: number,
  quantidade: number, responsavel: string, prioridade: RegistroGestao['prioridade'], dias = 0,
  descricao = ''): RegistroGestao {
  return { id, codigo, titulo, status, valor, quantidade, responsavel, prioridade,
    data: diasAtras(dias), descricao: descricao || `${titulo} - registro demonstrativo` };
}

const DADOS_INICIAIS: Record<ModuloGestao, RegistroGestao[]> = {
  fornecedores: [
    registro(1, 'FOR-001', 'Tech Distribuidora Ltda.', 'Ativo', 84200, 32, 'Mariana Costa', 'Normal', 20, 'Prazo médio: 5 dias | Avaliação: 4,8'),
    registro(2, 'FOR-002', 'Brasil Componentes S.A.', 'Ativo', 47500, 18, 'Carlos Lima', 'Normal', 15, 'Prazo médio: 8 dias | Avaliação: 4,4'),
    registro(3, 'FOR-003', 'Office Supply Comércio', 'Em análise', 12800, 7, 'Ana Souza', 'Alta', 2, 'Documentação cadastral pendente'),
  ],
  solicitacoes: [
    registro(1, 'SC-2026-041', 'Reposição de monitores', 'Aguardando aprovação', 25980, 20, 'Bruno Lima', 'Alta', 1),
    registro(2, 'SC-2026-040', 'Periféricos para onboarding', 'Aprovada', 12400, 40, 'Ana Souza', 'Normal', 3),
  ],
  cotacoes: [
    registro(1, 'COT-2026-018', 'Cotação de monitores 27”', 'Em análise', 24700, 20, 'Mariana Costa', 'Alta', 1, '3 propostas recebidas'),
    registro(2, 'COT-2026-017', 'Teclados e mouses', 'Concluída', 11650, 40, 'Carlos Lima', 'Normal', 4, 'Fornecedor vencedor definido'),
  ],
  pedidos: [
    registro(1, 'PC-2026-102', 'Pedido Tech Distribuidora', 'Confirmado', 24700, 20, 'Mariana Costa', 'Alta', 0, 'Entrega prevista em 5 dias'),
    registro(2, 'PC-2026-101', 'Pedido Brasil Componentes', 'Parcialmente recebido', 11650, 40, 'Carlos Lima', 'Normal', 5, '32 de 40 itens recebidos'),
  ],
  recebimentos: [
    registro(1, 'REC-2026-089', 'Recebimento PC-2026-101', 'Parcial', 9320, 32, 'João Estoquista', 'Normal', 1, 'Sem divergências'),
    registro(2, 'REC-2026-088', 'Recebimento de headsets', 'Concluído', 7485, 30, 'João Estoquista', 'Normal', 7),
  ],
  reposicao: [
    registro(1, 'REP-001', 'Monitor 27”', 'Comprar', 12990, 10, 'Planejamento', 'Crítica', 0, 'Atual: 0 | Mínimo: 5 | Máximo: 10 | Lead time: 5 dias'),
    registro(2, 'REP-002', 'Mouse Gamer', 'Comprar', 1119.30, 7, 'Planejamento', 'Alta', 0, 'Atual: 3 | Mínimo: 5 | Máximo: 10'),
  ],
  inventarios: [
    registro(1, 'INV-2026-009', 'Inventário geral - Matriz', 'Em contagem', 0, 84, 'Paulo Auditor', 'Alta', 0, '42 de 84 itens contados'),
    registro(2, 'INV-2026-008', 'Inventário de periféricos', 'Encerrado', 320.5, 18, 'Paulo Auditor', 'Normal', 30, 'Acuracidade: 98,7%'),
  ],
  contagem: [
    registro(1, 'CC-2026-115', 'Corredor A - Prateleira 01', 'Aguardando conferência', 159.9, 12, 'João Estoquista', 'Alta', 0, 'Divergência: -1 unidade'),
    registro(2, 'CC-2026-114', 'Corredor B - Prateleira 03', 'Conferida', 0, 24, 'Maria Silva', 'Normal', 2, 'Sem divergência'),
  ],
  lotes: [
    registro(1, 'LOT-2026-0018', 'Headset Bluetooth', 'Disponível', 4990, 20, 'João Estoquista', 'Normal', 10, 'Validade: 10/09/2028'),
    registro(2, 'LOT-2026-0017', 'Bateria recarregável', 'Próximo do vencimento', 1680, 120, 'Maria Silva', 'Crítica', 60, 'Validade: 30/10/2026'),
  ],
  series: [
    registro(1, 'SN-MON-000122', 'Monitor 27”', 'Em estoque', 1299, 1, 'João Estoquista', 'Normal', 8, 'Depósito Matriz / A-01-02'),
    registro(2, 'SN-NBK-000734', 'Notebook Corporativo', 'Em uso', 6850, 1, 'TI Corporativo', 'Normal', 120, 'Responsável: Ana Souza'),
  ],
  leitura: [
    registro(1, '7891234567890', 'Última leitura: Mouse Gamer', 'Processada', 159.9, 1, 'João Estoquista', 'Normal', 0, 'Entrada confirmada no depósito Matriz'),
  ],
  devolucoes: [
    registro(1, 'DEV-2026-014', 'Monitor com avaria', 'Aguardando coleta', 1299, 1, 'Mariana Costa', 'Alta', 2, 'Devolução ao fornecedor'),
    registro(2, 'DEV-2026-013', 'Retorno de teclado', 'Concluída', 349.9, 1, 'Bruno Lima', 'Normal', 9, 'Reintegrado ao estoque'),
  ],
  valorizacao: [
    registro(1, 'VAL-PER', 'Periféricos', 'Atualizado', 4678.50, 15, 'Controladoria', 'Normal', 0, 'Custo médio móvel'),
    registro(2, 'VAL-MON', 'Monitores', 'Atualizado', 0, 0, 'Controladoria', 'Alta', 0, 'Sem saldo disponível'),
  ],
  demanda: [
    registro(1, 'DEM-30D-001', 'Mouse Gamer', 'Risco de ruptura', 1119.30, 7, 'Planejamento', 'Crítica', 0, 'Previsão 30 dias: 9 | Cobertura: 10 dias'),
    registro(2, 'DEM-30D-002', 'Teclado Mecânico', 'Regular', 0, 0, 'Planejamento', 'Normal', 0, 'Previsão 30 dias: 6 | Cobertura: 60 dias'),
  ],
  'curva-abc': [
    registro(1, 'ABC-A-001', 'Monitor 27”', 'Classe A', 25980, 20, 'Controladoria', 'Alta', 0, '42% do valor movimentado'),
    registro(2, 'ABC-B-001', 'Teclado Mecânico', 'Classe B', 10497, 30, 'Controladoria', 'Normal', 0, '17% do valor movimentado'),
    registro(3, 'ABC-C-001', 'Mouse Gamer', 'Classe C', 4797, 30, 'Controladoria', 'Baixa', 0, '8% do valor movimentado'),
  ],
  relatorios: [
    registro(1, 'REL-EST', 'Posição atual do estoque', 'Disponível', 6674.5, 23, 'Gestão', 'Normal', 0),
    registro(2, 'REL-GIR', 'Giro e cobertura', 'Disponível', 0, 4, 'Gestão', 'Normal', 0),
    registro(3, 'REL-CMP', 'Compras por fornecedor', 'Disponível', 36350, 2, 'Gestão', 'Normal', 0),
  ],
  auditoria: [
    registro(1, 'AUD-00128', 'Login efetuado', 'Sucesso', 0, 1, 'admin', 'Normal', 0, 'Sessão demonstrativa iniciada'),
    registro(2, 'AUD-00127', 'Pedido PC-2026-102 confirmado', 'Sucesso', 24700, 20, 'Mariana Costa', 'Normal', 1),
  ],
  perfis: [
    registro(1, 'PER-ADM', 'Administrador', 'Ativo', 0, 12, 'Segurança', 'Normal', 0, 'Acesso completo'),
    registro(2, 'PER-EST', 'Estoquista', 'Ativo', 0, 6, 'Segurança', 'Normal', 0, 'Estoque, leitura e inventário'),
    registro(3, 'PER-COM', 'Comprador', 'Ativo', 0, 5, 'Segurança', 'Normal', 0, 'Fornecedores, cotações e pedidos'),
  ],
  configuracoes: [
    registro(1, 'CFG-EST', 'Limite padrão de estoque baixo', 'Ativa', 0, 5, 'Administrador', 'Normal', 0),
    registro(2, 'CFG-MOE', 'Moeda padrão', 'BRL', 0, 1, 'Administrador', 'Normal', 0),
  ],
  alertas: [
    registro(1, 'ALT-001', 'Monitor 27” sem estoque', 'Não lido', 12990, 10, 'Estoque', 'Crítica', 0, 'Reposição imediata recomendada'),
    registro(2, 'ALT-002', 'Lote próximo do vencimento', 'Não lido', 1680, 120, 'Qualidade', 'Alta', 0, 'Lote LOT-2026-0017'),
    registro(3, 'ALT-003', 'Pedido parcialmente recebido', 'Lido', 2330, 8, 'Compras', 'Normal', 1, 'PC-2026-101'),
  ],
};

@Injectable({ providedIn: 'root' })
export class GestaoService {
  private readonly estados = new Map<ModuloGestao, BehaviorSubject<RegistroGestao[]>>();

  constructor(private readonly atividadeService: AtividadeService) {
    (Object.keys(DADOS_INICIAIS) as ModuloGestao[]).forEach((modulo) =>
      this.estados.set(modulo, new BehaviorSubject(DADOS_INICIAIS[modulo])),
    );
  }

  registros$(modulo: ModuloGestao): Observable<RegistroGestao[]> {
    return this.estado(modulo).asObservable();
  }

  indicadores$(modulo: ModuloGestao): Observable<IndicadoresGestao> {
    return this.registros$(modulo).pipe(map((itens) => ({
      total: itens.length,
      pendentes: itens.filter((x) => /aguard|análise|parcial|contagem|comprar|não lido/i.test(x.status)).length,
      criticos: itens.filter((x) => x.prioridade === 'Crítica' || x.prioridade === 'Alta').length,
      valorTotal: itens.reduce((total, x) => total + x.valor, 0),
    })));
  }

  adicionarDemonstracao(modulo: ModuloGestao): Observable<RegistroGestao> {
    const subject = this.estado(modulo);
    const id = Math.max(0, ...subject.value.map((x) => x.id)) + 1;
    const novo = registro(id, `${modulo.toUpperCase().slice(0, 3)}-${String(id).padStart(4, '0')}`,
      `Novo registro de ${modulo}`, 'Rascunho', 0, 1, 'admin', 'Normal');
    return of(novo).pipe(delay(250), tap((item) => {
      subject.next([item, ...subject.value]);
      this.atividadeService.registrar({ usuario: 'admin', entidade: modulo, entidadeId: item.id,
        acao: 'inclusao', descricao: `${item.codigo} incluído em ${modulo}.`, valorPosterior: item });
    }));
  }

  atualizarStatus(modulo: ModuloGestao, id: number, status: string): Observable<RegistroGestao> {
    const subject = this.estado(modulo);
    const atual = subject.value.find((x) => x.id === id);
    if (!atual) return throwError(() => new Error('Registro não encontrado.'));
    const atualizado = { ...atual, status };
    return of(atualizado).pipe(delay(200), tap((item) => {
      subject.next(subject.value.map((x) => x.id === id ? item : x));
      this.atividadeService.registrar({ usuario: 'admin', entidade: modulo, entidadeId: id,
        acao: 'alteracao', descricao: `${atual.codigo}: status alterado para ${status}.`,
        valorAnterior: atual, valorPosterior: item });
    }));
  }

  marcarAlertasComoLidos(): void {
    const subject = this.estado('alertas');
    subject.next(subject.value.map((x) => ({ ...x, status: 'Lido' })));
  }

  alertasNaoLidos$(): Observable<number> {
    return this.registros$('alertas').pipe(map((itens) => itens.filter((x) => x.status === 'Não lido').length));
  }

  private estado(modulo: ModuloGestao): BehaviorSubject<RegistroGestao[]> {
    const subject = this.estados.get(modulo);
    if (!subject) throw new Error(`Módulo ${modulo} não configurado.`);
    return subject;
  }
}
