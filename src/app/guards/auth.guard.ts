import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Protege rotas administrativas (dashboard, produtos, categorias, usuários). */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.estaAutenticado()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

/** Evita que um usuário já autenticado acesse novamente a tela de login. */
export const redirecionarSeAutenticadoGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.estaAutenticado()) {
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
