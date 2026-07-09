# Quickstart: Recorrências (Recurring Transactions)

## Pré-requisitos

- Banco Postgres de desenvolvimento rodando (`docker compose up -d db`) e migrado
  (`npx prisma migrate dev`), já incluindo a migration do model `RecurringTransaction`
  (ver `data-model.md`).
- Servidor da API rodando (`npm run dev`).
- Um usuário autenticado (token JWT válido) e ao menos uma `Category` existente — reaproveite
  o fluxo já usado por `/v1/transactions`.

## Cenário 1 — Cadastrar e listar uma recorrência (User Story 1 e 2)

1. `POST /v1/recurring-transactions` com um corpo válido (ver
   `contracts/recurring-transactions.http.md`), `startDate` igual a hoje.
2. Esperado: `201` e mensagem de sucesso.
3. `GET /v1/recurring-transactions` com o mesmo usuário.
4. Esperado: `200` com a recorrência recém-criada na lista.
5. `GET /v1/recurring-transactions/:id` com o `id` de outro usuário (ou um UUID aleatório).
6. Esperado: `404`, nunca `403` (FR-007, SC-004).

## Cenário 2 — Editar e remover (User Story 2)

1. `PUT /v1/recurring-transactions/:id` alterando `amount` e `endDate`.
2. Esperado: `200`; `GET /:id` reflete os novos valores.
3. `DELETE /v1/recurring-transactions/:id`.
4. Esperado: `200`; `GET /:id` do mesmo `id` passa a retornar `404`.

## Cenário 3 — Geração automática de transações (User Story 3, SC-002, SC-003)

Executa o job diretamente, sem precisar de um agendador real configurado:

```bash
npm run jobs:process-recurring-transactions
```

1. Crie uma recorrência com `startDate` = hoje e `frequency = "DAILY"`.
2. Rode o comando acima.
3. Esperado: uma nova `Transaction` aparece para o usuário (verificável via
   `GET /v1/transactions`), com `date` igual a hoje, e a recorrência passa a ter
   `lastGeneratedDate` = hoje.
4. Rode o comando novamente sem alterar nada.
5. Esperado: nenhuma transação nova é criada (idempotência — FR-010, SC-003).

## Cenário 4 — Backfill de ciclos perdidos (FR-014)

1. Crie uma recorrência `DAILY` com `startDate` 3 dias no passado (via seed/dado de teste,
   já que a API não aceita `startDate` retroativo arbitrário sem um motivo de negócio — ajustar
   conforme regra final implementada).
2. Rode `npm run jobs:process-recurring-transactions`.
3. Esperado: 4 transações geradas (uma por dia, do `startDate` até hoje, inclusive), cada uma
   com a data de competência do respectivo dia — não 4 transações todas datadas de hoje.

## Validação automatizada

Os cenários acima MUST estar cobertos por:
- Testes e2e (`tests/e2e/modules/recurring-transactions/*.e2e.spec.ts`) para os Cenários 1 e
  2, via `app.inject()` contra o banco de teste (ver `research.md`, Decisão 4).
- Testes unitários (`tests/unit/modules/recurring-transactions/use-cases/*.spec.ts`) para
  `ProcessRecurringTransactionsUseCase`, cobrindo os Cenários 3 e 4 com um repository fake
  in-memory (sem bater no Postgres).
