import { Routes } from '@angular/router';
import { Dashboard } from './components/dashboard/dashboard';
import { Produto } from './components/pages/produto/produto';
import { Usuarios } from './components/pages/usuarios/usuarios';
import { CategoriaPage } from './components/pages/categoria/categoria';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: Dashboard },
  { path: 'produtos', component: Produto },
  { path: 'categorias', component: CategoriaPage },
  { path: 'usuarios', component: Usuarios },
  { path: '**', redirectTo: 'dashboard' },
];
