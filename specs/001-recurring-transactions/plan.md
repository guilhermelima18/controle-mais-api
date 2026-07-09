# Implementation Plan: Recorrências (Recurring Transactions)

**Branch**: `001-recurring-transactions` | **Date**: 2026-07-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-recurring-transactions/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Adicionar o domínio `recurring-transactions`, com CRUD HTTP autenticado para o usuário
gerenciar suas recorrências (assinaturas, aluguel, etc.) e um caso de uso autônomo
(`ProcessRecurringTransactionsUseCase`) disparado por um job externo agendado (cron), que
identifica ciclos vencidos e ainda não processados, gera a transação real correspondente com
a data de competência do ciclo, faz backfill completo de ciclos perdidos e marca cada ciclo
como processado para evitar duplicidade em reexecuções.

## Technical Context

**Language/Version**: TypeScript 5.7 sobre Node.js (`strict: true`, `target: es2019`,
`module`/`moduleResolution: nodenext`), mesmo runtime já usado no restante do projeto.

**Primary Dependencies**: Fastify v5 (HTTP), Prisma 7 com `@prisma/adapter-pg` (ORM/Postgres,
`moduleFormat = "cjs"` fixo — Princípio VII), Zod (validação de DTOs), `@fastify/jwt`
(autenticação, já configurado). O cálculo de próxima ocorrência por frequência usa aritmética
de datas em UTC nativa (`Date.UTC`/`getUTC*`), não `date-fns` — ver research.md, Decisão 2
(revisada durante a implementação por um bug de timezone). `date-fns` continua sendo uma
dependência do projeto, usada em outro ponto já existente
(`get-transactions-dashboard.ts`), mas não neste cálculo.

**Storage**: PostgreSQL (mesma instância/schema já usado pelas tabelas `User`, `Transaction`,
`Category`), acessado exclusivamente via Prisma Client.

**Testing**: Vitest (exigido pelo Princípio X da constitution). **Não está instalado no
projeto ainda** — é uma dependência nova a ser adicionada nesta feature, junto da configuração
mínima (`vitest.config.ts`, script `test` no `package.json`) e de um banco de teste real via
`docker-compose` para os testes e2e (ver `research.md`, Decisão 4).

**Target Platform**: Servidor Linux (mesmo ambiente de deploy do restante da API, ex: Render).

**Project Type**: Web service único (API HTTP) — não há frontend nem múltiplos projetos
neste repositório.

**Performance Goals**: Sem meta de performance específica além do padrão já aceito pelo
restante da API (resposta HTTP síncrona, sem SLA de latência definido). O job de geração
processa em lote todas as recorrências devidas de todos os usuários numa única execução
agendada; não há meta de throughput definida pois o volume esperado (recorrências por
usuário) é baixo.

**Constraints**: Valores monetários MUST seguir a mesma precisão/tipo já usado por
`Transaction.amount` (`Decimal(10,2)`), para manter consistência de arredondamento entre
recorrência e transação gerada. O job de geração MUST ser idempotente por ciclo (rodar mais
de uma vez no mesmo ciclo não pode duplicar transações — ver FR-010).

**Scale/Scope**: Um novo módulo de domínio (`recurring-transactions`) seguindo a mesma
estrutura dos módulos existentes (`transactions`, `categories`), mais um pequeno entrypoint de
job fora de `modules/` (análogo a `infra/http/server.ts`) para disparar o processamento
agendado.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Aplicação nesta feature | Status |
|---|---|---|
| I. Arquitetura por Domínio | Novo módulo em `src/modules/recurring-transactions/` com `dtos/`, `entities/`, `repositories/` (interface + `prisma/`), `use-cases/` e `infra/http/` (controllers + routes). Lógica de negócio só nos use cases. | PASS |
| II. Entidades Sem Vazamento de Forma Interna | `RecurringTransaction` terá props privadas, getters e `toJSON()` obrigatório retornando campos planos. | PASS |
| III. Identidade a partir do Token Autenticado | `userId` vem de `request.user.sub` nos controllers; busca/edição/remoção usa `findByIdAndUser`; recurso de outro usuário retorna 404 (`ResourceNotFoundError`), nunca 403. | PASS |
| IV. Erros de Domínio Tipados | Use cases lançam `ResourceNotFoundError` (reaproveitado de `core/errors/`) para recorrência inexistente/não pertencente ao usuário; controllers não fazem try/catch de erro de negócio. | PASS |
| V. Repository é a Única Porta de Dados | `IRecurringTransactionsRepository` é a única porta; implementação Prisma em `repositories/prisma/`; o use case de processamento também depende apenas de `ITransactionsRepository` (já existente) para criar as transações, sem importar Prisma diretamente. | PASS |
| VI. Injeção de Dependência Manual | Controllers e o entrypoint do job instanciam repository e use case manualmente (`new Prisma...Repository()`, `new ...UseCase(repo)`), sem container de DI. | PASS |
| VII. Formato de Módulo do Prisma Fixado | Nenhuma mudança em `generator`/`moduleFormat` do `schema.prisma`; só a adição do model `RecurringTransaction` e do enum `RecurringTransactionFrequency`. | PASS |
| VIII. Imports Relativos | Todo código novo usa imports relativos, sem o alias `@/`. | PASS |
| IX. Simplicidade (YAGNI) | Sem fila/message broker, sem biblioteca de agendamento (`node-cron` etc.) — o job é um script Node simples disparado por um agendador externo (cron do SO ou do provedor de deploy), fora do escopo desta mudança. Ver Complexity Tracking para a única adição de infraestrutura de teste. | PASS (com nota) |
| X. Testes Automatizados Obrigatórios | Cada use case novo terá teste unitário (repository fake in-memory) cobrindo caminho feliz e erros; cada rota HTTP terá teste e2e via `app.inject()` contra banco de teste real, incluindo o cenário de autorização cruzada. Vitest e banco de teste precisam ser configurados nesta feature (não existem ainda no projeto). | PASS (com nota) |

Nenhuma violação sem justificativa: as duas notas acima (ausência de scheduler dedicado;
Vitest/banco de teste ainda não configurados) são decisões de simplicidade e setup,
detalhadas em `research.md`, não desvios da constitution.

## Project Structure

### Documentation (this feature)

```text
specs/001-recurring-transactions/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── recurring-transactions.http.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── modules/
│   └── recurring-transactions/
│       ├── dtos/
│       │   ├── create-recurring-transaction.dto.ts
│       │   ├── update-recurring-transaction.dto.ts
│       │   └── list-recurring-transactions-filters.dto.ts
│       ├── entities/
│       │   └── recurring-transaction.ts
│       ├── repositories/
│       │   ├── irecurring-transactions-repository.ts
│       │   └── prisma/
│       │       └── prisma-recurring-transactions-repository.ts
│       ├── use-cases/
│       │   ├── create-recurring-transaction.ts
│       │   ├── update-recurring-transaction.ts
│       │   ├── delete-recurring-transaction.ts
│       │   ├── fetch-recurring-transaction.ts
│       │   ├── fetch-recurring-transactions.ts
│       │   └── process-recurring-transactions.ts   # use case autônomo (job)
│       └── infra/http/
│           ├── controllers/
│           │   ├── create-recurring-transaction.controller.ts
│           │   ├── update-recurring-transaction.controller.ts
│           │   ├── delete-recurring-transaction.controller.ts
│           │   ├── fetch-recurring-transaction.controller.ts
│           │   └── fetch-recurring-transactions.controller.ts
│           └── routes.ts
├── infra/
│   ├── http/            # já existente (app.ts, server.ts)
│   └── jobs/
│       └── process-recurring-transactions.job.ts   # entrypoint do worker/cron
└── core/errors/          # já existente, reaproveitado (ResourceNotFoundError)

tests/
├── unit/
│   └── modules/recurring-transactions/use-cases/*.spec.ts
└── e2e/
    └── modules/recurring-transactions/*.e2e.spec.ts
```

**Structure Decision**: Projeto único (web service), sem frontend. O CRUD segue exatamente a
estrutura já usada por `transactions`/`categories` dentro de `src/modules/recurring-transactions/`.
O único elemento fora do padrão de módulo é o entrypoint do job
(`src/infra/jobs/process-recurring-transactions.job.ts`), colocado em `src/infra/` — ao lado
de `src/infra/http/server.ts` — porque é um ponto de entrada de processo (análogo ao
servidor HTTP), não lógica de negócio; a lógica de negócio do processamento continua dentro do
módulo, em `use-cases/process-recurring-transactions.ts`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Nenhuma violação de princípio a justificar. As duas notas do Constitution Check (ausência de
scheduler dedicado; necessidade de configurar Vitest e banco de teste) são trabalho de setup
necessário para cumprir a constitution, não desvios dela — detalhes em `research.md`.
