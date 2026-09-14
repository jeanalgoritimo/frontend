# Implementação - Gestão de Estoque e Suprimentos

## Acesso local

- Usuário: `admin`
- Senha: `admin`

As credenciais são fixas apenas para demonstração. Nenhuma senha é armazenada no navegador.

## Módulos disponíveis

| Grupo | Telas |
| --- | --- |
| Cadastros | Produtos, Categorias, Usuários e Fornecedores |
| Estoque | Movimentações, Depósitos, Localizações, Reservas, Reposição, Inventários, Contagem cíclica, Lotes, Séries, Leitura, Devoluções e Valorização |
| Compras | Solicitações, Cotações, Pedidos e Recebimentos |
| Planejamento | Previsão de demanda |
| Relatórios | Visão geral e Curva ABC |
| Administração | Perfis, Auditoria e Configurações |
| Operação | Dashboard e Central de alertas |

## Arquitetura

Os CRUDs originais e a primeira fase de estoque possuem models, services e páginas próprios. Os novos módulos gerenciais compartilham o componente `GestaoPage`, configurado pela rota, e o `GestaoService`, que mantém coleções reativas por domínio.

Essa composição evita duplicar vinte páginas praticamente iguais e mantém rotas, títulos, status, filtros e ações específicos. Na integração futura, cada coleção pode ser extraída para seu próprio service HTTP sem reescrever os componentes de apresentação.

## Recursos técnicos

- Angular 21 standalone;
- RxJS com `BehaviorSubject`, `combineLatest`, `map`, `switchMap`, `tap`, `delay` e `async pipe`;
- filtros por texto e status;
- indicadores calculados a partir dos streams;
- alteração de status com histórico de atividade;
- exportação CSV;
- guard de autenticação e guard de autorização;
- tema claro/escuro;
- layout responsivo com Bootstrap 5;
- testes unitários com Vitest.

## Validação

```bash
npm ci
npm test -- --watch=false
npm run build
```

O estado é reiniciado ao atualizar a aplicação porque esta versão não possui backend. A próxima evolução recomendada é uma API ASP.NET Core com SQL Server, autenticação JWT/OIDC, autorização por policies e endpoints separados por domínio.
