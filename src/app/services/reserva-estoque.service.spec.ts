import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ReservaEstoqueService } from './reserva-estoque.service';
import { ProdutoService } from './produto.service';

describe('ReservaEstoqueService', () => {
  let service: ReservaEstoqueService;
  let produtoService: ProdutoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReservaEstoqueService);
    produtoService = TestBed.inject(ProdutoService);
  });

  it('deve criar uma reserva dentro do estoque disponível', async () => {
    const produto = produtoService.produtosAtuais()[0];

    const reserva = await firstValueFrom(
      service.criar({
        produtoId: produto.id,
        quantidade: 1,
        solicitante: 'Bruno Lima',
        finalidade: 'Separação de pedido',
        data: new Date(),
        validade: new Date(Date.now() + 86400000),
      }),
    );

    expect(reserva.status).toBe('ativa');
  });

  it('não deve permitir reserva maior que o estoque disponível', async () => {
    const produto = produtoService.produtosAtuais()[0];

    await expect(
      firstValueFrom(
        service.criar({
          produtoId: produto.id,
          quantidade: produto.estoque + 1000,
          solicitante: 'Bruno Lima',
          finalidade: 'Separação de pedido',
          data: new Date(),
          validade: new Date(Date.now() + 86400000),
        }),
      ),
    ).rejects.toThrow('Quantidade maior que o estoque disponível.');
  });

  it('deve reduzir a disponibilidade do produto após reservar', async () => {
    const produto = produtoService.produtosAtuais()[0];

    await firstValueFrom(
      service.criar({
        produtoId: produto.id,
        quantidade: 2,
        solicitante: 'Bruno Lima',
        finalidade: 'Separação de pedido',
        data: new Date(),
        validade: new Date(Date.now() + 86400000),
      }),
    );

    const disponibilidades = await firstValueFrom(service.disponibilidadePorProduto$);
    const disponibilidade = disponibilidades.find((d) => d.produtoId === produto.id)!;

    expect(disponibilidade.reservado).toBe(2);
    expect(disponibilidade.disponivel).toBe(produto.estoque - 2);
  });

  it('deve cancelar uma reserva ativa', async () => {
    const produto = produtoService.produtosAtuais()[0];
    const reserva = await firstValueFrom(
      service.criar({
        produtoId: produto.id,
        quantidade: 1,
        solicitante: 'Bruno Lima',
        finalidade: 'Teste',
        data: new Date(),
        validade: new Date(Date.now() + 86400000),
      }),
    );

    const cancelada = await firstValueFrom(service.cancelar(reserva.id));
    expect(cancelada.status).toBe('cancelada');
  });
});
