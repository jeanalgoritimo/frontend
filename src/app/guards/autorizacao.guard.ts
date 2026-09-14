import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Permissao, PermissaoService } from '../services/permissao.service';

export const autorizacaoGuard: CanActivateFn = (route) => {
  const permissoes = inject(PermissaoService);
  const router = inject(Router);
  const permissao = route.data['permissao'] as Permissao | undefined;
  return !permissao || permissoes.possui(permissao) ? true : router.createUrlTree(['/dashboard']);
};
