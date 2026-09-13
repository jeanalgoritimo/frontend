export type AcaoAtividade =
  | 'inclusao'
  | 'alteracao'
  | 'exclusao'
  | 'ativacao'
  | 'desativacao'
  | 'aprovacao'
  | 'rejeicao'
  | 'cancelamento'
  | 'login'
  | 'logout';

/**
 * Registro do log central de atividades. Serve de base para a futura tela de
 * Auditoria (Fase 3), que reaproveitará este mesmo log em vez de duplicá-lo.
 */
export interface RegistroAtividade {
  id: number;
  dataHora: Date;
  usuario: string;
  entidade: string;
  entidadeId: number | string;
  acao: AcaoAtividade;
  descricao: string;
  valorAnterior?: unknown;
  valorPosterior?: unknown;
}
