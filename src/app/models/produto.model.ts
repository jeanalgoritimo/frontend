export interface Produto {
  id: number;
  nome: string;
  categoria: string;
  preco: number;
  estoque: number;
  ativo: boolean;
}

export interface ProdutoEstatisticas {
  totalProdutos: number;
  valorTotalEstoque: number;
  produtosBaixoEstoque: number;
  produtosAtivos: number;
}
