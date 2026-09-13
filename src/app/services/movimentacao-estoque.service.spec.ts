import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { MovimentacaoEstoqueService } from './movimentacao-estoque.service';
import { ProdutoService } from './produto.service';
import { NovaMovimentacaoEstoque } from '../models/movimentacao-estoque.model';

describe('MovimentacaoEstoqueService', () => {
  let service: MovimentacaoEstoqueService;
  let produtoService: ProdutoService;

  const baseDto: Omit<NovaMovimentacaoEstoque, 'tipo' | 'quantidade'> = {
    produtoId: 1,
    depositoOrigemId: null,
    depositoDestinoId: 1,
    localizacaoOrigemId: null,
    localizacaoDestinoId: null,
    usuarioResponsavel: 'admin',
    documentoReferencia: 'NF-001',
    custoUnitario: 10,
    observacao: '',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MovimentacaoEstoqueService);
    produtoService = TestBed.inject(ProdutoService);
  });

  it('deve rejeitar quantidade menor ou igual a zero', async () => {
    await expect(
      firstValueFrom(service.registrar({ ...baseDto, tipo: 'entrada', quantidade: 0 })),
    ).rejects.toThrow('Quantidade deve ser maior que zero.');
  });

  it('deve aumentar o estoque do produto ao registrar uma entrada', async () => {
    const produtoAntes = produtoService.produtosAtuais().find((p) => p.id === 1)!;

    await firstValueFrom(service.registrar({ ...baseDto, tipo: 'entrada', quantidade: 5 }));

    const produtoDepois = produtoService.produtosAtuais().find((p) => p.id === 1)!;
    expect(produtoDepois.estoque).toBe(produtoAntes.estoque + 5);
  });

  it('não deve permitir saída maior que o saldo disponível', async () => {
    const produto = produtoService.produtosAtuais().find((p) => p.id === 1)!;

    await expect(
      firstValueFrom(
        service.registrar({
          ...baseDto,
          tipo: 'saida',
          quantidade: produto.estoque + 1000,
          depositoOrigemId: 1,
          depositoDestinoId: null,
        }),
      ),
    ).rejects.toThrow('Quantidade maior que o saldo disponível.');
  });

  it('transferência exige depósito de origem e destino diferentes', async () => {
    await expect(
      firstValueFrom(
        service.registrar({
          ...baseDto,
          tipo: 'transferencia',
          quantidade: 1,
          depositoOrigemId: 1,
          depositoDestinoId: 1,
        }),
      ),
    ).rejects.toThrow('Depósito de origem e destino devem ser diferentes.');
  });

  it('deve cancelar uma movimentação confirmada gerando uma movimentação inversa', async () => {
    const entrada = await firstValueFrom(service.registrar({ ...baseDto, tipo: 'entrada', quantidade: 5 }));
    const produtoAposEntrada = produtoService.produtosAtuais().find((p) => p.id === 1)!;

    const estorno = await firstValueFrom(service.cancelar(entrada.id, 'admin'));

    expect(estorno.tipo).toBe('saida');
    expect(estorno.movimentacaoOrigemId).toBe(entrada.id);

    const produtoAposEstorno = produtoService.produtosAtuais().find((p) => p.id === 1)!;
    expect(produtoAposEstorno.estoque).toBe(produtoAposEntrada.estoque - 5);

    const movimentacoes = await firstValueFrom(service.movimentacoes$);
    expect(movimentacoes.find((m) => m.id === entrada.id)?.status).toBe('confirmada');
  });
});
