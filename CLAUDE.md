# Controle+ API

API REST de controle financeiro pessoal (pt-BR). Fastify 5 + TypeScript (CommonJS) + Prisma 7 + PostgreSQL.
Front-end irmão: `../controle-mais-web` (Next.js) — **repositório git separado**, não é monorepo.

## ⚠️ Leia antes de qualquer mudança

**`.specify/memory/constitution.md` é a autoridade deste projeto** (v1.0.0, 10 princípios, 2 NON-NEGOTIABLE). Tem precedência sobre qualquer convenção não documentada, e emendá-la exige aprovação explícita do mantenedor **antes** do PR de implementação — nunca altere a constitution e assuma a mudança como vigente no mesmo PR.

Vários princípios nasceram de bugs reais em produção. Os que mais quebram código novo:

| # | Regra | Consequência de ignorar |
|---|---|---|
| I | Estrutura fixa `src/modules/<domínio>/{dtos,entities,repositories,use-cases,infra/http}`. Sem lógica de negócio em controller/routes. Proibido criar camada cross-domínio (ex. `services/`). | NON-NEGOTIABLE |
| II | Toda entidade que pode aparecer numa resposta HTTP precisa de `toJSON()`. | Fastify serializa `{"props":{...}}` — já quebrou 4 endpoints |
| III | `userId` **sempre** de `request.user.sub`, nunca do body/params. Update/delete via `findByIdAndUser` (não `findById` + check), retornando **404, nunca 403**. | Já houve furo real: usuário editava/apagava transação de outro |
| IV | Use cases lançam subclasses de `AppError`. Controllers **não** dão try/catch em erro de negócio nem comparam `error.message`; só tratam Zod (400). | Erro escapa como 500 |
| V | Só `repositories/prisma/*` importa Prisma Client. | — |
| VI | DI manual (`new PrismaXRepository()` no controller). Proibido container de DI. | — |
| VII | `moduleFormat = "cjs"` no generator do Prisma é obrigatório e explícito. | Quebrou o deploy no Render: `ReferenceError: exports is not defined in ES module scope` |
| VIII | **Use imports relativos.** O alias `@/` está no `paths` do tsconfig mas **não tem resolução em runtime** (nem `tsx`, nem build). | Quebra em runtime, `tsc --noEmit` passa |
| X | Use case novo/alterado → unitário com fake in-memory (**nunca** mockar Prisma nem bater em banco). Rota nova/alterada → e2e via `app.inject()` cobrindo happy path, contrato de erro e **autorização cruzada**. | NON-NEGOTIABLE — bloqueio de merge |

Mudança em `prisma/schema.prisma` (generator/datasource) ou no par `module`/`moduleResolution` do tsconfig **exige validar o build de produção de ponta a ponta** (`npm run build && node dist/infra/http/server.js` respondendo uma rota que toque o Prisma). `tsc --noEmit` passar não é suficiente — o bug do Princípio VII só aparece em runtime.

## Comandos

```bash
docker compose up -d db      # Postgres 15 (db-controle-mais) na 5432
npx prisma migrate dev       # ou: npm run prisma:migrate (deploy)
npm run dev                  # tsx watch, porta 3333
npm run build && npm start   # produção
npx vitest run tests/unit    # 57 testes, não precisa de banco
npm test                     # ⚠️ ver abaixo
npm run jobs:process-recurring-transactions   # roda o job de recorrências manualmente
```

**⚠️ `npm test` apaga o banco de desenvolvimento.** `tests/setup-env.ts` só troca a connection string se `DATABASE_URL_TEST` existir — e ela **não está no `.env`**, nem há um segundo banco no `docker-compose.yml`. O `beforeEach` de todo e2e chama `cleanDatabase()` (`deleteMany` nas 6 tabelas). O `research.md` da 001 prescreve um banco separado que nunca foi provisionado. **Crie o banco de teste e adicione `DATABASE_URL_TEST` antes de rodar a suíte completa.**

## Arquitetura

```
src/
├── @types/fastify.d.ts        # FastifyInstance.authenticate
├── config/env.ts              # ÚNICA leitura de process.env do projeto
├── core/errors/               # AppError (statusCode), ResourceNotFoundError
├── generated/prisma/          # Prisma Client (gitignored)
├── infra/
│   ├── @shared/middlewares/ensure-authenticated.ts
│   ├── database/prisma.ts     # PrismaPg adapter + client singleton
│   ├── http/app.ts            # monta plugins, rotas e error handler global
│   ├── http/server.ts         # ÚNICO .listen() + startScheduledJobs()
│   └── jobs/                  # scheduler node-cron + composition root do job
└── modules/{auth,users,categories,transactions,recurring-transactions,statement-imports}/
```

Cada módulo repete `dtos/` (Zod por ação + `z.infer`), `entities/` (props privadas + getters + `toJSON()`), `repositories/{i*.ts, prisma/}`, `use-cases/{errors/}` (1 classe por arquivo), `infra/http/{controllers,routes.ts}`. `statement-imports` adiciona `providers/` — única entrada em "Complexity Tracking", justificada por isolar a OpenAI e o fallback.

Prefixos em `infra/http/app.ts`: `/v1/auth`, `/v1/users`, `/v1/transactions`, `/v1/categories`, `/v1/recurring-transactions`, `/v1/statement-imports` (23 endpoints).

**Contrato de erro (heterogêneo — o front depende disso):**
- `AppError` → `{ "error": "mensagem" }` com o `statusCode` do erro
- 401 → `{ "message": "Não autorizado" }`
- Zod (nos controllers) → 400 `{ "errors": [{ "campo": "...", "message": "..." }] }`
- Não tratado → 500 `{ "error": "Erro interno do servidor." }`

**Nenhuma rota declara `schema` do Fastify** — não há validação nem serialização de resposta pelo framework, então todo campo novo numa entidade vaza automaticamente para a API. `Decimal` chega ao cliente como **string**.

**Auth:** JWT stateless, payload `{ name }` + `sign: { sub: user.id, expiresIn: "7d" }`. Login por **CPF** (normalizado com `replace(/\D/g,"")`) + senha. Rotas públicas: `POST /v1/auth` e `POST /v1/users`. Sem roles/RBAC — autorização é sempre ownership escopada no repository.

## Domínio

- **Categorias são globais** (`Category` não tem `userId`, `name` é unique global) — decisão explícita, não é bug.
- **Recorrências** (`specs/001`): frequências DAILY/WEEKLY/MONTHLY/YEARLY. O job cron (default `*/15 * * * *`) materializa as transações devidas com backfill de ciclos perdidos; idempotência via `lastGeneratedDate`. `calculate-due-cycles.ts` faz aritmética **toda em UTC** e clampa o dia ao último do mês (31 → 28/29/30).
- **Importação de extratos** (`specs/002`): PDF/XLSX/CSV/OFX/BBT/TXT → texto único → OpenAI (`gpt-5-mini`, JSON Schema strict) com **fallback determinístico** transparente (regex/parsers) → revisão/edição/descarte → confirmação cria as transações reais. Duplicata por data+valor+descrição normalizada (NFD, sem diacríticos, lowercase). Formato resolvido só pela **extensão** do arquivo.
- **Nunca chamar a OpenAI real em teste** — use `makeStatementFileParser()`; `tests/setup-env.ts` força `STATEMENT_IMPORT_USE_FAKE_AI_PROVIDER=true`.

## Estado atual

Branch `staging`. `specs/001-recurring-transactions` (43/43) e `specs/002-bank-statement-import` (60/60) implementadas e testadas. `tsc --noEmit` limpo. Não há `README`.

**Os 4 módulos pré-spec-kit (`auth`, `users`, `categories`, `transactions`) têm zero testes** e antecedem a constitution — 13 dos 23 endpoints não têm cobertura. Ao mexer neles, o Princípio X passa a valer: siga o padrão dos módulos novos, não o do código que você encontrar lá.

## Problemas conhecidos (não são surpresas — são dívida mapeada)

**Segurança:**
1. `modules/users/infra/http/controllers/create-user.controller.ts:8` — `console.log(request.body)` **loga a senha em texto claro**.
2. `GET /v1/users` e `GET /v1/users/:id` expõem **CPF e e-mail de todos os usuários** para qualquer autenticado, sem paginação nem RBAC.
3. `config/env.ts:6` — `JWT_SECRET` tem fallback `"super-secret-key"`; `env.ts` não valida nada com Zod, então `DATABASE_URL` ausente vira a string `"undefined"` na connection string.
4. `app.register(cors)` sem opções (qualquer origem). Sem rate limit em `/v1/auth` (brute force) nem em `/v1/statement-imports` (cada upload é chamada paga à OpenAI).

**Contrato:**
5. `GET /v1/transactions/:id` **não retorna 404** — repassa o `null` do repository e responde **200 com corpo `null`**. Divergente de todos os outros módulos e **quebra a tela de edição do front**.
6. `PUT` e `DELETE /v1/transactions/:id` respondem **201** em vez de 200/204. `UserAlreadyExistsError` usa **401** (deveria ser 409). `CategoryNotFoundError` existe duas vezes com status diferentes (404 em recurring, 400 em statement-imports).
7. `transactions` e `categories` usam `z.string()` para `type` (em vez de `z.enum`), `z.number()` sem `.positive()` para `amount`, e não validam `categoryId` → erro do Prisma não tratado vira **500** em vez de 400/404. Os módulos spec-driven fazem certo.
8. **Não existe `GET /v1/statement-imports`** (listagem/histórico) nem `DELETE`. O front não consegue montar histórico nem recuperar um import cujo `id` o usuário perdeu.

**Operacional:**
9. O cron roda **dentro do processo da API** (`server.ts` → `scheduler.ts`), sem lock distribuído. Com mais de uma réplica, cada uma executa o job; `create` + `updateLastGeneratedDate` não são transacionais → risco de transação duplicada, exatamente o que FR-010/SC-003 proíbem.
10. `confirm` de importação também não é transacional: cria N transações em loop e só depois marca `CONFIRMED`. Falha no meio deixa o import `READY_FOR_REVIEW` com transações criadas, e um novo `confirm` estoura na unique de `Transaction.extractedTransactionId` → 500 permanente.
11. **Zero `@@index` no schema.** Faltam em `Transaction.userId`, `Transaction.date`, `Transaction.categoryId`, `RecurringTransaction.startDate`, `ExtractedTransaction.statementImportId`.
12. `findManyDue` carrega todas as recorrências de todos os usuários em memória, sem paginação.
13. `package.json` aponta `prisma.seed` para `prisma/seed.ts`, que **não existe**.
14. Sem logger configurado, sem health check, sem `/`. `noImplicitAny: false` afrouxa o `strict: true` exigido pela constitution.
