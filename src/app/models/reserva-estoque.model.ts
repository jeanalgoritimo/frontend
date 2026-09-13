export type StatusReservaEstoque = 'ativa' | 'atendida' | 'expirada' | 'cancelada';

export interface ReservaEstoque {
  id: number;
  produtoId: number;
  quantidade: number;
  solicitante: string;
  finalidade: string;
  data: Date;
  validade: Date;
  status: StatusReservaEstoque;
}

/** Dados de entrada para criar uma nova reserva (id/status são calculados pelo service). */
export type NovaReservaEstoque = Omit<ReservaEstoque, 'id' | 'status'>;

/** Visão de disponibilidade de um produto: físico, reservado e disponível. */
export interface DisponibilidadeProduto {
  produtoId: number;
  estoqueFisico: number;
  reservado: number;
  disponivel: number;
}
