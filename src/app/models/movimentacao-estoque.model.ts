export type TipoMovimentacaoEstoque =
  | 'entrada'
  | 'saida'
  | 'ajuste-positivo'
  | 'ajuste-negativo'
  | 'transferencia'
  | 'devolucao';

export type StatusMovimentacaoEstoque = 'confirmada' | 'cancelada';

export interface MovimentacaoEstoque {
  id: number;
  codigo: string;
  produtoId: number;
  tipo: TipoMovimentacaoEstoque;
  quantidade: number;
  depositoOrigemId: number | null;
  depositoDestinoId: number | null;
  localizacaoOrigemId: number | null;
  localizacaoDestinoId: number | null;
  dataHora: Date;
  usuarioResponsavel: string;
  documentoReferencia: string;
  custoUnitario: number;
  observacao: string;
  saldoAnterior: number;
  saldoPosterior: number;
  status: StatusMovimentacaoEstoque;
  /** Preenchido quando este registro é o estorno (inverso) de outra movimentação. */
  movimentacaoOrigemId?: number;
}

/** Dados de entrada para registrar uma nova movimentação (id/código/saldos são calculados pelo service). */
export type NovaMovimentacaoEstoque = Omit<
  MovimentacaoEstoque,
  'id' | 'codigo' | 'dataHora' | 'saldoAnterior' | 'saldoPosterior' | 'status' | 'movimentacaoOrigemId'
>;

/** Saldo de um produto em um depósito, derivado reativamente do log de movimentações. */
export interface SaldoDeposito {
  produtoId: number;
  depositoId: number;
  quantidade: number;
}
