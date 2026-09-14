export type ModuloGestao =
  | 'fornecedores' | 'solicitacoes' | 'cotacoes' | 'pedidos' | 'recebimentos'
  | 'reposicao' | 'inventarios' | 'contagem' | 'lotes' | 'series' | 'leitura'
  | 'devolucoes' | 'valorizacao' | 'demanda' | 'curva-abc' | 'relatorios'
  | 'auditoria' | 'perfis' | 'configuracoes' | 'alertas';

export interface RegistroGestao {
  id: number;
  codigo: string;
  titulo: string;
  descricao: string;
  status: string;
  valor: number;
  quantidade: number;
  data: Date;
  responsavel: string;
  prioridade: 'Baixa' | 'Normal' | 'Alta' | 'Crítica';
  detalhes?: Record<string, string | number | boolean>;
}

export interface ConfiguracaoModulo {
  modulo: ModuloGestao;
  titulo: string;
  subtitulo: string;
  icone: string;
  cor: string;
  rotuloNovo: string;
  colunas: { chave: keyof RegistroGestao; titulo: string; formato?: 'moeda' | 'data' }[];
  status: string[];
}

export interface IndicadoresGestao {
  total: number;
  pendentes: number;
  criticos: number;
  valorTotal: number;
}
