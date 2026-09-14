import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { GestaoService } from './gestao.service';

describe('GestaoService', () => {
  let service: GestaoService;
  beforeEach(() => { service = TestBed.inject(GestaoService); });

  it('deve calcular indicadores do módulo', async () => {
    const indicadores = await firstValueFrom(service.indicadores$('alertas'));
    expect(indicadores.total).toBe(3);
    expect(indicadores.criticos).toBe(2);
  });

  it('deve adicionar um registro demonstrativo', async () => {
    const antes = await firstValueFrom(service.registros$('fornecedores'));
    await firstValueFrom(service.adicionarDemonstracao('fornecedores'));
    const depois = await firstValueFrom(service.registros$('fornecedores'));
    expect(depois.length).toBe(antes.length + 1);
  });

  it('deve atualizar o status preservando o registro', async () => {
    await firstValueFrom(service.atualizarStatus('pedidos', 1, 'Recebido'));
    const pedidos = await firstValueFrom(service.registros$('pedidos'));
    expect(pedidos.find((x) => x.id === 1)?.status).toBe('Recebido');
  });

  it('deve marcar os alertas como lidos', async () => {
    service.marcarAlertasComoLidos();
    const alertas = await firstValueFrom(service.registros$('alertas'));
    expect(alertas.every((x) => x.status === 'Lido')).toBe(true);
  });
});
