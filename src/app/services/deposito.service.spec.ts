import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { DepositoService } from './deposito.service';

describe('DepositoService', () => {
  let service: DepositoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DepositoService);
  });

  it('deve criar um depósito válido', async () => {
    const deposito = await firstValueFrom(
      service.adicionar({
        codigo: 'DEP-03',
        nome: 'Depósito Teste',
        descricao: 'Descrição',
        endereco: 'Rua Teste, 1',
        responsavel: 'Carla Dias',
        ativo: true,
      }),
    );

    expect(deposito.id).toBeGreaterThan(0);
  });

  it('deve rejeitar código duplicado', async () => {
    await expect(
      firstValueFrom(
        service.adicionar({
          codigo: 'DEP-01',
          nome: 'Outro Depósito',
          descricao: '',
          endereco: '',
          responsavel: '',
          ativo: true,
        }),
      ),
    ).rejects.toThrow('Já existe um depósito com este código.');
  });

  it('não deve remover depósito com estoque alocado (localização ocupada)', async () => {
    // o depósito id=1 do seed possui a localização id=1 ocupada
    await expect(firstValueFrom(service.remover(1))).rejects.toThrow(
      'Não é possível remover um depósito com estoque alocado.',
    );
  });
});
