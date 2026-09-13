export interface Localizacao {
  id: number;
  depositoId: number;
  corredor: string;
  prateleira: string;
  posicao: string;
  capacidade: number;
  ocupacaoAtual: number;
  ativa: boolean;
}

/** Localização com o percentual de ocupação calculado (view model, não persistido). */
export interface LocalizacaoComOcupacao extends Localizacao {
  percentualOcupacao: number;
}
