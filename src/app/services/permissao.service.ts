import { Injectable } from '@angular/core';

export type Permissao = 'dashboard.visualizar' | 'estoque.gerenciar' | 'compras.gerenciar' |
  'relatorios.visualizar' | 'administracao.gerenciar';

@Injectable({ providedIn: 'root' })
export class PermissaoService {
  private readonly permissoesAdmin = new Set<Permissao>([
    'dashboard.visualizar', 'estoque.gerenciar', 'compras.gerenciar',
    'relatorios.visualizar', 'administracao.gerenciar',
  ]);

  possui(permissao: Permissao): boolean { return this.permissoesAdmin.has(permissao); }
}
