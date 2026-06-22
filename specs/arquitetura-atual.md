# Arquitetura Atual — Controle+ API

> Documento gerado por engenharia reversa do código-fonte existente em `src/` e `prisma/`. Reflete estritamente o que está implementado nesta revisão do repositório (branch `master`, commit `89d6534`). Não contém funcionalidades planejadas ou propostas.

## 1. Visão Geral

### Propósito
API de controle financeiro pessoal (Controle+). Permite que um usuário se autentique, cadastre categorias de receita/despesa e registre transações financeiras (entradas e saídas), com consulta filtrada, paginada e um resumo (dashboard) do mês corrente.

### Stack e Arquitetura Base
- **Runtime/Linguagem**: Node.js + TypeScript.
- **Framework HTTP**: Fastify v5 (`src/server.ts`).
- **ORM**: Prisma 7 (`prisma-client` generator, output customizado em `src/generated/prisma`), com adapter `@prisma/adapter-pg` conectando diretamente via `pg` a um banco **PostgreSQL**.
- **Autenticação**: `@fastify/jwt`, com estratégia JWT stateless. O segredo vem de `process.env.JWT_SECRET` (fallback hardcoded `"super-secret-key"` se a env não estiver definida).
- **Validação de payloads**: `zod` (schemas definidos dentro de cada controller).
- **Hash de senha**: `bcrypt`.
- **Datas**: `date-fns` (usado no dashboard para cálculo de início/fim de mês).
- **CORS**: `@fastify/cors` registrado globalmente sem configuração de origem restrita (permissivo).

### Padrão Arquitetural
O projeto segue uma separação em 3 camadas por domínio (`auth`, `users`, `transactions`, `categories`), cada uma com:
- **routes/**: registram o método HTTP, o path e o middleware `onRequest: [fastify.authenticate]` (quando a rota exige autenticação). Apenas delegam para o controller.
- **controllers/**: validam o payload (body/params/query) com Zod, chamam o service correspondente e tratam a resposta HTTP/erros.
- **services/**: contêm a lógica de negócio e o acesso ao banco via Prisma Client.

Não há camada de "repository" separada — os services acessam o Prisma Client diretamente (`src/libs/prisma.ts`).

### Autenticação e Autorização
- `app.decorate("authenticate", ...)` em `src/server.ts` é o guard usado em `onRequest` das rotas protegidas; ele chama `request.jwtVerify()` e, em caso de falha, apenas envia o erro (não interrompe explicitamente com `return`, comportamento herdado do código atual).
- O token é emitido em `POST /v1/auth` com `sub` = `user.id` e expiração de **7 dias**. O payload assinado inclui `name`.
- `request.user` (decodificado do JWT) é usado nos controllers de transação para extrair `sub` (id do usuário) e escopar consultas por usuário.
- **Não há controle de papéis/permissões (RBAC)** — qualquer usuário autenticado pode acessar qualquer endpoint protegido, incluindo listar todos os usuários ou criar categorias.
- As rotas de **criar usuário** (`POST /v1/users`) e **login** (`POST /v1/auth`) são públicas (sem `onRequest: authenticate`).

### Tratamento de Erros
Existe um `setErrorHandler` global em `server.ts`: erros com `statusCode === 401` retornam `{ message: "Não autorizado" }`; demais erros retornam `error.statusCode ?? 500` com `{ message: error.message }`. Esse handler global coexiste com tratamento de erro local feito em try/catch dentro de cada controller (que geralmente já responde antes do handler global ser acionado).

---

## 2. Modelo de Dados

Definido em `prisma/schema.prisma`. Datasource: PostgreSQL.

### `User`
| Campo | Tipo | Observações |
|---|---|---|
| id | String (uuid) | PK, gerado automaticamente |
| cpf | String | **único** |
| name | String | obrigatório |
| email | String | obrigatório (sem constraint de unicidade no schema) |
| password | String | hash bcrypt |
| createdAt | DateTime | default `now()` |
| updatedAt | DateTime | atualizado automaticamente |

Relação: `User 1 — N Transaction`.

### `Category`
| Campo | Tipo | Observações |
|---|---|---|
| id | String (uuid) | PK |
| name | String | **único** |
| type | `TransactionType` | INCOME ou EXPENSE |

Relação: `Category 1 — N Transaction`.

### `Transaction`
| Campo | Tipo | Observações |
|---|---|---|
| id | String (uuid) | PK |
| description | String | obrigatório |
| amount | Decimal(10,2) | obrigatório |
| type | `TransactionType` | INCOME ou EXPENSE |
| date | DateTime | default `now()` (data do fato financeiro) |
| userId | String | FK → User.id |
| categoryId | String | FK → Category.id |
| createdAt | DateTime | default `now()` (data de criação do registro) |

Relações: `Transaction N — 1 User`, `Transaction N — 1 Category`.

### Enum `TransactionType`
`INCOME` | `EXPENSE`

### Observações sobre o modelo
- Não há tabela/relação de "orçamento", "metas", "tags" ou "recorrência" — apenas usuários, categorias e transações.
- Categorias são globais (não pertencem a um usuário específico); não há isolamento de categorias por usuário.
- `Transaction` não possui `updatedAt`.

---

## 3. Regras de Negócio Implementadas (camada `services`)

### Autenticação (`services/auth/index.ts` — `AuthService`)
- Recebe `cpf` e `password`.
- Normaliza o CPF removendo tudo que não é dígito (`replace(/\D/g, "")`) antes de buscar o usuário.
- Se usuário não existe **ou** senha não confere (`bcrypt.compare`), lança o mesmo erro genérico `"Usuário e/ou senha incorretos!"` (evita enumeração de usuários).
- Retorna apenas `{ id, name, email }` do usuário autenticado (nunca a senha).

### Usuários (`services/users/*`)
- **UserCreateService**: normaliza CPF (remove não-dígitos); verifica unicidade do CPF antes de criar; lança `"Esse usuário já existe!"` se já houver usuário com o mesmo CPF; faz hash da senha com `bcrypt` (custo 8); persiste o usuário com a senha já hasheada.
- **UserListService**: busca usuário por `id`; lança `"Esse usuário não existe!"` se não encontrado.
- **UsersListService**: retorna todos os usuários sem filtro/paginação (`findMany()` sem `where`).
- Em ambos os controllers de listagem, a resposta é mapeada manualmente para `{ id, name, cpf, email }`, **excluindo a senha** do retorno (apesar do `service` retornar o objeto completo do Prisma, incluindo o hash).

### Categorias (`services/categories/*`)
- **CategoryCreateService**: cria categoria com `name` e `type`. Não há verificação prévia de duplicidade no código do service (a unicidade de `name` é garantida apenas pela constraint `@unique` do banco, que gerará erro do Prisma se violada — esse erro não é tratado especificamente no controller, cairia no genérico 500).
- **CategoryListService**: busca por `id`; lança `"Essa categoria não existe!"` se não encontrada.
- **CategoriesListService**: lista todas as categorias sem filtro.

### Transações (`services/transactions/*`)
- **TransactionCreateService**: cria transação com `description`, `amount`, `type`, `date`, `userId`, `categoryId`. Não valida explicitamente se `userId`/`categoryId` existem antes de criar (depende da FK do banco para rejeitar referências inválidas).
- **TransactionUpdateService**: atualiza por `transactionId`, aceitando campos parciais (`description`, `amount`, `type`, `date`, `categoryId`) e exige `userId` (reatribuído na atualização). Não valida se a transação pertence ao usuário autenticado antes de atualizar — qualquer usuário autenticado pode atualizar qualquer transação por id.
- **TransactionDeleteService**: verifica existência da transação por `id`; lança `"Essa transação não existe!"` se não encontrada; deleta sem verificar se pertence ao usuário autenticado.
- **TransactionListService**: busca uma transação por `id` **e** `userId = user.sub` (token JWT) simultaneamente — aqui sim há escopo por usuário —, incluindo dados da `category`.
- **TransactionsListDashboardService**: calcula resumo financeiro do **mês corrente** (do usuário autenticado, via `user.sub`):
  - Filtra transações com `date` entre o início do mês atual (inclusive) e o início do mês seguinte (exclusive), usando `date-fns` (`startOfMonth`, `addMonths`).
  - Soma `income` (INCOME) e `expense` (EXPENSE).
  - Calcula `total = income - expense`.
  - Agrupa valores por categoria dentro de cada tipo (`perType.income`, `perType.expense`), cada item com `name`, `value` e `percentage` (percentual relativo ao total do tipo, arredondado a 1 casa decimal; 0 se o total do tipo for 0).
- **TransactionsListFiltersService**: lista transações do usuário autenticado com filtros e paginação:
  - Filtros suportados: `type` (apenas aceita literalmente `"EXPENSE"` ou `"INCOME"`, qualquer outro valor é ignorado/undefined), `categoryId`, `search` (busca case-insensitive em `description` via `contains`), `initialDate`/`finalDate` (intervalo de datas, normalizado para início/fim do dia em UTC).
  - Sempre escopado por `userId = user.sub`.
  - Paginação: `page` (default 1) e `perPage` (default 3), usando `skip`/`take`. Retorna `data` e `meta` (`totalItems`, `currentPage`, `totalPages`, `itemsPerPage`), calculados via `prisma.$transaction` (count + findMany na mesma transação).
  - Resultados ordenados por `date` decrescente, com `category` incluída.

### Validações nos controllers (Zod)
- **Auth**: `cpf` (string obrigatória), `password` (string, mínimo 6 caracteres).
- **User create**: `name` (obrigatório), `cpf` (obrigatório), `email` (formato de e-mail válido via `z.email`), `password` (mínimo 6 caracteres).
- **Transaction create**: `description`, `amount` (number), `type` (string), `date` (string), `userId`, `categoryId` — todos obrigatórios; **não valida** que `type` seja exatamente `INCOME`/`EXPENSE` (é apenas `z.string()`, depois forçado via cast TypeScript `as "INCOME" | "EXPENSE"`).
- **Transaction update**: todos os campos opcionais exceto `userId` (obrigatório); mesma observação sobre `type` não ser validado como enum.
- **Transaction delete**: valida apenas `id` (vindo de `params`).
- **Transactions list (filters)**: todos os campos de query opcionais (`search`, `type`, `category`, `initialDate`, `finalDate`, `page`, `perPage`), todos como string (conversão de página/perPage para número ocorre no controller).
- **Category create**: `name` e `type` obrigatórios (strings); mesma observação — `type` não é validado como enum estrito.

---

## 4. Endpoints (API)

Prefixo global por domínio definido em `src/server.ts`. Todas as rotas abaixo, exceto onde indicado "🔓 pública", exigem header `Authorization: Bearer <token>` (JWT) via hook `fastify.authenticate`.

### Autenticação — prefixo `/v1/auth`
| Método | Path | Auth | Descrição | Payload |
|---|---|---|---|---|
| POST | `/v1/auth` | 🔓 pública | Login. Retorna `{ user: { id, name, email }, token }` | Body: `{ cpf: string, password: string (min 6) }` |

### Usuários — prefixo `/v1/users`
| Método | Path | Auth | Descrição | Payload |
|---|---|---|---|---|
| POST | `/v1/users` | 🔓 pública | Cria um novo usuário | Body: `{ name: string, cpf: string, email: string (formato válido), password: string (min 6) }` |
| GET | `/v1/users` | 🔒 | Lista todos os usuários (sem paginação/filtro) | — Retorna array de `{ id, name, cpf, email }` |
| GET | `/v1/users/:id` | 🔒 | Busca um usuário por id | Params: `id` — Retorna `{ id, name, cpf, email }` |

### Transações — prefixo `/v1/transactions`
| Método | Path | Auth | Descrição | Payload |
|---|---|---|---|---|
| GET | `/v1/transactions` | 🔒 | Lista transações do usuário autenticado com filtros e paginação | Query: `search?, type?("INCOME"\|"EXPENSE"), category?, initialDate?, finalDate?, page?, perPage?` (defaults: page=1, perPage=3) |
| GET | `/v1/transactions/dashboard` | 🔒 | Resumo financeiro do mês corrente do usuário autenticado | — Retorna `{ total, income, expense, perType: { income: [...], expense: [...] } }` |
| GET | `/v1/transactions/:id` | 🔒 | Busca uma transação por id, escopada ao usuário autenticado | Params: `id` |
| POST | `/v1/transactions` | 🔒 | Cria uma transação | Body: `{ description: string, amount: number, type: string, date: string, userId: string, categoryId: string }` |
| PUT | `/v1/transactions/:id` | 🔒 | Atualiza (parcialmente) uma transação | Params: `id` — Body: `{ description?, amount?, type?, date?, categoryId?, userId: string }` |
| DELETE | `/v1/transactions/:id` | 🔒 | Exclui uma transação | Params: `id` |

> Nota: a ordem de registro das rotas em `server.ts` faz com que `transactionsListFiltersRoute` (`GET /`) e `transactionsListDashboardRoute` (`GET /dashboard`) sejam registradas antes de `transactionListRoute` (`GET /:id`) — relevante para evitar colisão de rota entre `/dashboard` e `/:id` no Fastify.

### Categorias — prefixo `/v1/categories`
| Método | Path | Auth | Descrição | Payload |
|---|---|---|---|---|
| GET | `/v1/categories` | 🔒 | Lista todas as categorias | — |
| GET | `/v1/categories/:id` | 🔒 | Busca uma categoria por id | Params: `id` |
| POST | `/v1/categories` | 🔒 | Cria uma categoria | Body: `{ name: string, type: string }` |

---

## Pontos de Atenção Identificados (apenas observação, não prescritivo)
- `TransactionUpdateService` e `TransactionDeleteService` não verificam se a transação pertence ao usuário autenticado (`request.user.sub`) antes de alterar/excluir — diferente de `TransactionListService`, que filtra por `userId`.
- `email` em `User` não possui constraint de unicidade no schema, apenas formato validado no create.
- Os campos `type` em `Transaction` e `Category` são validados como `string` genérica no Zod, sem restrição ao enum `INCOME`/`EXPENSE` — a conversão para o tipo correto é feita via cast TypeScript, não validação em runtime.
- O guard `authenticate` em `server.ts` não retorna (`return reply.send(err)`) após enviar erro 401, podendo permitir que o handler da rota continue executando em paralelo no catch de erro do Fastify (comportamento dependente da versão do Fastify).
- CORS está habilitado sem restrição de origem.
