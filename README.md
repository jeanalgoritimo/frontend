# Painel de Gestão — Frontend

Aplicação SPA (Single Page Application) para gestão de **Produtos** e **Usuários**, com um **Dashboard** consolidando indicadores dos dois módulos em tempo real.

## Tecnologias utilizadas

| Camada              | Tecnologia                                                                 |
| ------------------- | --------------------------------------------------------------------------- |
| Framework           | [Angular 21](https://angular.dev) (standalone components, sem `NgModule`)  |
| Linguagem           | TypeScript 5.9                                                             |
| Programação reativa | [RxJS 7](https://rxjs.dev) (`BehaviorSubject`, `Subject`, `combineLatest`) |
| Estilo/UI           | [Bootstrap 5](https://getbootstrap.com) + [Bootstrap Icons](https://icons.getbootstrap.com) |
| Roteamento          | Angular Router (`provideRouter`)                                           |
| Formulários         | Angular Forms (`FormsModule` / `ngModel`, template-driven)                 |
| Testes unitários    | Vitest + Angular Testing Utilities                                         |
| Build/CLI           | Angular CLI (`@angular/build`)                                            |

Não há backend/API real: os dados são mantidos em memória, dentro dos *services*, simulando chamadas assíncronas (latência via `delay`) — o que permite trocar facilmente por chamadas HTTP reais no futuro sem alterar os componentes.

## Estrutura do projeto

```
src/app/
├── app.ts / app.html / app.scss      # Shell da aplicação (navbar + sidebar + router-outlet)
├── app.routes.ts                     # Definição das rotas
├── models/                           # Interfaces de domínio (Produto, Usuario)
├── services/                         # Regras de negócio + estado reativo (RxJS)
│   ├── produto.service.ts
│   └── usuario.service.ts
└── components/
    ├── navbar/                       # Barra superior com botão de alternar o menu
    ├── sidebar/                      # Menu lateral retrátil (responsivo)
    ├── dashboard/                    # Indicadores consolidados (produtos + usuários)
    └── pages/
        ├── produto/                  # CRUD de produtos
        └── usuarios/                 # CRUD de usuários
```

## Funcionalidades

### Dashboard
- Combina os streams de estatísticas de **Produtos** e **Usuários** em uma única visão (`combineLatest`).
- Cards com total de produtos, produtos ativos, produtos com estoque baixo e valor total em estoque.
- Cards com total de usuários, usuários ativos e administradores ativos.

### Produtos
- Listagem com busca por nome (debounce de 300ms, sem chamadas a cada tecla digitada).
- Cadastro, edição inline e remoção de produtos.
- Indicadores de estoque baixo destacados visualmente.

### Usuários
- Listagem com busca por nome ou e-mail (debounce de 300ms).
- Cadastro de usuários com perfil **Administrador** ou **Usuário**.
- Ativação/desativação e remoção de usuários.

### Layout
- Navbar fixa com botão para alternar o menu lateral.
- Sidebar retrátil: no desktop recolhe/expande a largura; no mobile vira um *drawer* sobreposto com fundo escurecido, fechando ao clicar fora ou em um link.
- Interface construída com componentes Bootstrap (cards, badges, tabelas responsivas, spinners de carregamento).

## Regras de negócio

### Produtos
1. O **nome** do produto é obrigatório.
2. O **preço** deve ser maior que zero.
3. O **estoque** não pode ser negativo.
4. Produtos com estoque menor que **5 unidades** são sinalizados como "estoque baixo" no Dashboard e na listagem.

### Usuários
1. O **nome** é obrigatório e o **e-mail** deve ter um formato válido.
2. Não é permitido cadastrar dois usuários com o **mesmo e-mail**.
3. **Não é possível desativar o último administrador ativo** do sistema (garante que sempre exista pelo menos um admin ativo).
4. **Não é possível remover o último administrador ativo** do sistema, pela mesma razão.

## Arquitetura reativa (RxJS)

Cada *service* (`ProdutoService`, `UsuarioService`) expõe:
- `BehaviorSubject` como fonte única do estado atual (lista em memória).
- Um `Subject` de busca com `debounceTime` + `distinctUntilChanged`, combinado (`combineLatest`) com a lista de dados para gerar a listagem filtrada de forma reativa.
- Um stream de estatísticas (`map`) derivado do estado, usado tanto nas páginas quanto no Dashboard.
- Operações de escrita (`adicionar`, `atualizar`, `remover`, `alternarAtivo`) que validam as regras de negócio, simulam latência de rede (`delay`) e atualizam o estado via `tap`, controlando `loading` (`finalize`) e erros (`catchError`/`throwError`).

Os componentes consomem os streams via `async pipe` no template, sem `subscribe` manual para leitura — evitando vazamento de memória (*memory leaks*).

## Como executar

Instalar dependências:

```bash
npm install
```

Rodar o servidor de desenvolvimento:

```bash
npm start
```

Acesse `http://localhost:4200/`.

Rodar os testes unitários:

```bash
npm test
```

Gerar o build de produção (saída em `dist/`):

```bash
npm run build
```
