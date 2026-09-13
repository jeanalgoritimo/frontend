import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { AtividadeService } from './atividade.service';

describe('AtividadeService', () => {
  let service: AtividadeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AtividadeService);
  });

  it('deve registrar uma atividade e expô-la em atividades$', async () => {
    service.registrar({
      usuario: 'admin',
      entidade: 'Produto',
      entidadeId: 1,
      acao: 'inclusao',
      descricao: 'Produto criado',
    });

    const atividades = await firstValueFrom(service.atividades$);
    expect(atividades.length).toBe(1);
    expect(atividades[0].descricao).toBe('Produto criado');
  });

  it('deve retornar as últimas atividades em ordem decrescente', async () => {
    service.registrar({ usuario: 'admin', entidade: 'Produto', entidadeId: 1, acao: 'inclusao', descricao: 'Primeira' });
    service.registrar({ usuario: 'admin', entidade: 'Produto', entidadeId: 2, acao: 'inclusao', descricao: 'Segunda' });

    const ultimas = await firstValueFrom(service.ultimasAtividades$(1));
    expect(ultimas.length).toBe(1);
    expect(ultimas[0].descricao).toBe('Segunda');
  });
});
