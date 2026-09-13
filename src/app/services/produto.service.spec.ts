import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ProdutoService } from './produto.service';

describe('ProdutoService.ajustarEstoque', () => {
  let service: ProdutoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProdutoService);
  });

  it('deve aumentar o estoque com delta positivo', async () => {
    const produto = service.produtosAtuais()[0];

    const atualizado = await firstValueFrom(service.ajustarEstoque(produto.id, 5));

    expect(atualizado.estoque).toBe(produto.estoque + 5);
  });

  it('deve rejeitar quando o resultado ficaria negativo', async () => {
    const produto = service.produtosAtuais()[0];

    await expect(
      firstValueFrom(service.ajustarEstoque(produto.id, -(produto.estoque + 1))),
    ).rejects.toThrow('Estoque não pode ficar negativo.');
  });

  it('deve rejeitar produto inexistente', async () => {
    await expect(firstValueFrom(service.ajustarEstoque(999999, 1))).rejects.toThrow(
      'Produto não encontrado.',
    );
  });
});
