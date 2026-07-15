# API Contract: Statement Imports

Prefixo: `/v1/statement-imports` (registrado em `infra/http/app.ts`, mesmo padrão dos demais
módulos). Todas as rotas exigem autenticação (`app.authenticate`, JWT — Princípio III);
`userId` sempre resolvido de `request.user.sub`, nunca do body/params.

Erros comuns a todas as rotas abaixo (contrato já usado pelo restante da API, ver
`infra/http/app.ts`):

- `400` — payload inválido (Zod) ou erro de domínio de validação (`AppError` com
  `statusCode = 400`, ex: formato de arquivo não suportado, valor não positivo).
- `401` — token ausente/inválido.
- `404` — `StatementImport` ou `ExtractedTransaction` inexistente, ou pertencente a outro
  usuário (nunca `403` — Princípio III).
- `500` — erro não tratado.

---

## POST /v1/statement-imports

Envia um novo arquivo de extrato para importação (User Story 1).

**Request**: `multipart/form-data`

- `file` (obrigatório): binário do arquivo. Extensão/`mimetype` MUST corresponder a um dos
  formatos suportados (`.pdf`, `.xlsx`, `.csv`, `.ofx`, `.bbt`, `.txt`).

**Response 201** — processamento síncrono concluído (sucesso ou "nenhuma transação"):

```json
{
  "statementImport": {
    "id": "uuid",
    "fileName": "extrato-julho.ofx",
    "fileFormat": "OFX",
    "status": "READY_FOR_REVIEW",
    "extractionMethod": "AI",
    "failureReason": null,
    "createdAt": "2026-07-14T12:00:00.000Z",
    "confirmedAt": null
  },
  "extractedTransactions": [
    {
      "id": "uuid",
      "date": "2026-07-01T00:00:00.000Z",
      "description": "SUPERMERCADO ABC",
      "amount": "150.32",
      "type": "EXPENSE",
      "categoryId": "uuid-ou-null",
      "isDuplicate": false,
      "discarded": false
    }
  ]
}
```

- `status = "NO_TRANSACTIONS_FOUND"` quando o arquivo foi lido (por IA ou fallback) mas nenhum
  lançamento foi identificado (FR-011) — `extractedTransactions` retorna `[]`; **não** é um
  erro HTTP.
- `extractionMethod` é `"AI"` quando o GPT-5-Mini concluiu a extração, ou `"FALLBACK"` quando a
  IA falhou/estourou o limite de tokens e o parser determinístico assumiu (FR-015, FR-016) —
  nesse segundo caso vale a pena revisar a pré-visualização com atenção redobrada, já que o
  fallback tem cobertura/precisão menores (ver spec.md, Assumptions).

**Response 400** (`AppError`, formato não suportado ou arquivo corrompido/vazio) — FR-002:

```json
{ "error": "Formato de arquivo não suportado." }
```

**Response 400** (falha de AMBOS os caminhos de extração — IA e fallback) — FR-012, FR-015,
`StatementExtractionFailedError`:

```json
{ "error": "Não foi possível interpretar o arquivo no momento. Tente novamente." }
```

(Esse erro só ocorre quando a extração via IA falha/estoura o limite de tokens **e** o parser
de fallback também não consegue extrair nada de aproveitável. Nesse caso o `StatementImport`
já foi persistido com `status = "FAILED"` e `failureReason` preenchido; o cliente pode
consultar `GET /v1/statement-imports/:id` para ver o motivo, ou reenviar o arquivo em uma nova
submissão. Quando apenas a IA falha mas o fallback tem sucesso, a resposta é `201` normal, com
`extractionMethod: "FALLBACK"` — não um erro.)

---

## GET /v1/statement-imports/:id

Consulta uma importação existente e suas transações extraídas (suporte a reload da tela de
revisão — User Story 2).

**Response 200**: mesmo formato do corpo de sucesso do `POST` acima.

**Response 404**: import inexistente ou não pertence ao usuário autenticado.

---

## PATCH /v1/statement-imports/:id/extracted-transactions/:extractedTransactionId

Edita uma transação extraída antes da confirmação (FR-006).

**Request body** (todos os campos opcionais, ao menos um obrigatório):

```json
{
  "date": "2026-07-01T00:00:00.000Z",
  "description": "Supermercado ABC - ajustado",
  "amount": "149.90",
  "type": "EXPENSE",
  "categoryId": "uuid"
}
```

**Response 200**: objeto `ExtractedTransaction` atualizado (mesmo formato usado dentro de
`extractedTransactions[]` acima).

**Response 400**: `amount` não positivo, `type` inválido, `categoryId` referenciando
categoria inexistente, ou `StatementImport` já `CONFIRMED` (não é mais editável — estado
inválido para a operação, não um caso de "não encontrado", por isso `400` e não `404`).

**Response 404**: `StatementImport` ou `ExtractedTransaction` inexistente / não pertence ao
usuário.

---

## DELETE /v1/statement-imports/:id/extracted-transactions/:extractedTransactionId

Remove (descarta) uma transação extraída da pré-visualização, sem excluí-la fisicamente
(FR-007).

**Response 204**: sem corpo; item passa a ter `discarded = true` e não aparece mais como
pendente de confirmação.

**Response 400**: `StatementImport` já `CONFIRMED` (não é mais editável).

**Response 404**: `StatementImport` ou `ExtractedTransaction` inexistente / não pertence ao
usuário.

---

## POST /v1/statement-imports/:id/confirm

Confirma a importação, criando uma `Transaction` real para cada `ExtractedTransaction` não
descartada (FR-008, User Story 2).

**Request body**: nenhum.

**Response 200**:

```json
{
  "statementImport": { "id": "uuid", "status": "CONFIRMED", "confirmedAt": "2026-07-14T12:05:00.000Z", "...": "..." },
  "createdTransactions": [
    { "id": "uuid", "extractedTransactionId": "uuid", "amount": "150.32", "type": "EXPENSE", "date": "2026-07-01T00:00:00.000Z" }
  ]
}
```

**Response 400**:

- Existe ao menos uma `ExtractedTransaction` não descartada sem `categoryId` — resposta
  indica quais itens precisam de categoria antes de confirmar.
- `StatementImport` já está `CONFIRMED` (confirmação não é reexecutável).

**Response 404**: `StatementImport` inexistente ou não pertence ao usuário.
