import { Routes } from '@angular/router';
import { Dashboard } from './components/dashboard/dashboard';
import { Produto } from './components/pages/produto/produto';
import { Usuarios } from './components/pages/usuarios/usuarios';
import { CategoriaPage } from './components/pages/categoria/categoria';
import { Login } from './components/pages/login/login';
import { AdminLayout } from './components/layout/admin-layout/admin-layout';
import { authGuard, redirecionarSeAutenticadoGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: Login, canActivate: [redirecionarSeAutenticadoGuard] },
  {
    path: '',
    component: AdminLayout,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard },
      { path: 'produtos', component: Produto },
      { path: 'categorias', component: CategoriaPage },
      { path: 'usuarios', component: Usuarios },
    ],
  },
  { path: '**', redirectTo: '' },
];
