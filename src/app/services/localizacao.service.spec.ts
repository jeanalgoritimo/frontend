import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { LocalizacaoService } from './localizacao.service';

describe('LocalizacaoService', () => {
  let service: LocalizacaoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalizacaoService);
  });

  it('deve rejeitar capacidade negativa', async () => {
    await expect(
      firstValueFrom(
        service.adicionar({
          depositoId: 1,
          corredor: 'A1',
          prateleira: '01',
          posicao: '01',
          capacidade: -1,
          ocupacaoAtual: 0,
          ativa: true,
        }),
      ),
    ).rejects.toThrow('Capacidade não pode ser negativa.');
  });

  it('deve rejeitar ocupação maior que a capacidade', async () => {
    await expect(
      firstValueFrom(
        service.adicionar({
          depositoId: 1,
          corredor: 'A1',
          prateleira: '01',
          posicao: '01',
          capacidade: 10,
          ocupacaoAtual: 20,
          ativa: true,
        }),
      ),
    ).rejects.toThrow('Ocupação não pode ser maior que a capacidade.');
  });

  it('deve criar uma localização válida', async () => {
    const localizacao = await firstValueFrom(
      service.adicionar({
        depositoId: 1,
        corredor: 'C3',
        prateleira: '02',
        posicao: '01',
        capacidade: 30,
        ocupacaoAtual: 0,
        ativa: true,
      }),
    );

    expect(localizacao.id).toBeGreaterThan(0);
  });

  it('não deve remover localização ocupada', async () => {
    // a localização id=1 do seed possui ocupacaoAtual > 0
    await expect(firstValueFrom(service.remover(1))).rejects.toThrow(
      'Não é possível remover uma localização ocupada.',
    );
  });

  it('deve remover localização sem ocupação', async () => {
    // a localização id=2 do seed possui ocupacaoAtual = 0
    await firstValueFrom(service.remover(2));
    const localizacoes = service.localizacoesAtuais();
    expect(localizacoes.find((l) => l.id === 2)).toBeUndefined();
  });
});
