import { Routes } from '@angular/router';
import { Dashboard } from './components/dashboard/dashboard';
import { Produto } from './components/pages/produto/produto';
import { Usuarios } from './components/pages/usuarios/usuarios';
import { CategoriaPage } from './components/pages/categoria/categoria';
import { Login } from './components/pages/login/login';
import { AdminLayout } from './components/layout/admin-layout/admin-layout';
import { authGuard, redirecionarSeAutenticadoGuard } from './guards/auth.guard';
import { MovimentacaoEstoquePage } from './components/pages/movimentacao-estoque/movimentacao-estoque';
import { DepositoPage } from './components/pages/deposito/deposito';
import { LocalizacaoPage } from './components/pages/localizacao/localizacao';
import { ReservaEstoquePage } from './components/pages/reserva-estoque/reserva-estoque';
import { GestaoPage } from './components/pages/gestao/gestao';
import { autorizacaoGuard } from './guards/autorizacao.guard';

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
      { path: 'estoque/movimentacoes', component: MovimentacaoEstoquePage },
      { path: 'estoque/depositos', component: DepositoPage },
      { path: 'estoque/localizacoes', component: LocalizacaoPage },
      { path: 'estoque/reservas', component: ReservaEstoquePage },
      { path: 'fornecedores', component: GestaoPage, data: { modulo: 'fornecedores' } },
      { path: 'compras/solicitacoes', component: GestaoPage, data: { modulo: 'solicitacoes' } },
      { path: 'compras/cotacoes', component: GestaoPage, data: { modulo: 'cotacoes' } },
      { path: 'compras/pedidos', component: GestaoPage, data: { modulo: 'pedidos' } },
      { path: 'compras/recebimentos', component: GestaoPage, data: { modulo: 'recebimentos' } },
      { path: 'estoque/reposicao', component: GestaoPage, data: { modulo: 'reposicao' } },
      { path: 'estoque/inventarios', component: GestaoPage, data: { modulo: 'inventarios' } },
      { path: 'estoque/contagem-ciclica', component: GestaoPage, data: { modulo: 'contagem' } },
      { path: 'estoque/lotes', component: GestaoPage, data: { modulo: 'lotes' } },
      { path: 'estoque/series', component: GestaoPage, data: { modulo: 'series' } },
      { path: 'estoque/leitura', component: GestaoPage, data: { modulo: 'leitura' } },
      { path: 'estoque/devolucoes', component: GestaoPage, data: { modulo: 'devolucoes' } },
      { path: 'estoque/valorizacao', component: GestaoPage, data: { modulo: 'valorizacao' } },
      { path: 'planejamento/demanda', component: GestaoPage, data: { modulo: 'demanda' } },
      { path: 'relatorios/curva-abc', component: GestaoPage, data: { modulo: 'curva-abc' } },
      { path: 'relatorios', component: GestaoPage, data: { modulo: 'relatorios' } },
      { path: 'administracao/auditoria', component: GestaoPage, canActivate: [autorizacaoGuard], data: { modulo: 'auditoria', permissao: 'administracao.gerenciar' } },
      { path: 'administracao/perfis', component: GestaoPage, canActivate: [autorizacaoGuard], data: { modulo: 'perfis', permissao: 'administracao.gerenciar' } },
      { path: 'administracao/configuracoes', component: GestaoPage, canActivate: [autorizacaoGuard], data: { modulo: 'configuracoes', permissao: 'administracao.gerenciar' } },
      { path: 'alertas', component: GestaoPage, data: { modulo: 'alertas' } },
    ],
  },
  { path: '**', redirectTo: '' },
];
