# Contract: `/v1/recurring-transactions`

Todas as rotas exigem autenticação (`Authorization: Bearer <token>`, mesmo guard já usado por
`/v1/transactions`). `userId` é sempre derivado de `request.user.sub`, nunca do payload.

## POST /v1/recurring-transactions

Cria uma recorrência para o usuário autenticado (FR-001, FR-002, User Story 1).

**Request body**:
```json
{
  "description": "string, obrigatório",
  "amount": "number > 0, obrigatório",
  "type": "INCOME | EXPENSE, obrigatório",
  "frequency": "DAILY | WEEKLY | MONTHLY | YEARLY, obrigatório",
  "startDate": "string (data ISO), obrigatório",
  "endDate": "string (data ISO), opcional, deve ser posterior a startDate",
  "categoryId": "string, obrigatório, deve existir"
}
```

**Responses**:
- `201`: `{ "success": true, "message": "Recorrência criada com sucesso!" }`
- `400`: erro de validação Zod — `{ "errors": [{ "campo": string, "message": string }] }`
- `401`: não autenticado.

## GET /v1/recurring-transactions

Lista as recorrências do usuário autenticado (FR-003, User Story 2).

**Responses**:
- `200`: `{ "data": RecurringTransaction[] }` — cada item no formato de `toJSON()` da entidade.
- `401`: não autenticado.

## GET /v1/recurring-transactions/:id

Detalha uma recorrência específica do usuário autenticado (FR-004).

**Responses**:
- `200`: `RecurringTransaction` (formato `toJSON()`).
- `404`: recorrência inexistente ou pertencente a outro usuário (FR-007) —
  `{ "error": "Essa recorrência não existe!" }`.
- `401`: não autenticado.

## PUT /v1/recurring-transactions/:id

Atualiza uma recorrência do usuário autenticado (FR-005). Mesmas regras de validação do
`POST`, todos os campos opcionais (atualização parcial).

**Responses**:
- `200`: `{ "success": true, "message": "Recorrência atualizada com sucesso!" }`
- `400`: erro de validação Zod.
- `404`: recorrência inexistente ou de outro usuário (mesma semântica do `GET /:id`).
- `401`: não autenticado.

## DELETE /v1/recurring-transactions/:id

Remove uma recorrência do usuário autenticado (FR-006). Não afeta transações já geradas
anteriormente (Assumption do spec).

**Responses**:
- `200`: `{ "success": true, "message": "Recorrência removida com sucesso!" }`
- `404`: recorrência inexistente ou de outro usuário.
- `401`: não autenticado.

---

## Contrato interno: `ProcessRecurringTransactionsUseCase` (sem rota HTTP)

Não exposto via HTTP — chamado apenas pelo entrypoint de job
(`src/infra/jobs/process-recurring-transactions.job.ts`, ver `research.md` Decisão 3).

**Entrada**: nenhuma (processa todas as recorrências de todos os usuários numa execução).

**Comportamento** (FR-008 a FR-014, User Story 3):
1. Busca recorrências com `startDate <= hoje` (sem filtrar por `endDate` nesta etapa — uma
   recorrência já encerrada pode ainda ter ciclos pendentes de backfill dentro da sua janela
   válida; quem decide se há algo a gerar é o passo 2, não esta busca).
2. Para cada uma, calcula todos os ciclos vencidos desde `lastGeneratedDate ?? startDate`
   até hoje, respeitando `endDate` como teto (research.md, Decisão 1); recorrências sem
   nenhum ciclo pendente são ignoradas nesta execução.
3. Gera uma `Transaction` por ciclo vencido, com `date` = data de competência do ciclo.
4. Atualiza `lastGeneratedDate` para a data do último ciclo gerado.

**Saída**: nenhuma resposta HTTP — efeito colateral no banco (transações criadas,
`lastGeneratedDate` atualizado). Recomendado registrar em log quantas transações foram
geradas por execução, para observabilidade do job.
