# Phase 1 Data Model: Importação de Extratos Bancários

Extensão do `prisma/schema.prisma` existente. Segue as convenções já usadas pelo projeto
(uuid como id, `Decimal(10,2)` para valores monetários, enums Prisma, relações nomeadas
explicitamente, nullable FK com `onDelete: SetNull` no padrão já usado por
`RecurringTransaction` → `Transaction`).

## Novos Enums

### StatementFileFormat

Formato do arquivo originalmente enviado pelo usuário.

- `PDF`
- `XLSX`
- `CSV`
- `OFX`
- `BBT`
- `TXT`

### StatementImportStatus

Ciclo de vida de uma importação (FR-001 a FR-012).

- `RECEIVED` — arquivo recebido, ainda não processado.
- `PROCESSING` — em processamento (estado transitório; como o fluxo é síncrono do ponto de
  vista do usuário, esse estado existe principalmente para registro/observabilidade).
- `READY_FOR_REVIEW` — extração concluída com ao menos uma transação identificada; aguardando
  revisão/confirmação do usuário (User Story 2).
- `NO_TRANSACTIONS_FOUND` — extração concluída, mas nenhuma transação foi identificada
  (FR-011) — estado terminal informativo, não um erro.
- `CONFIRMED` — usuário confirmou a importação; transações reais foram criadas.
- `FAILED` — falha ao processar o arquivo (formato inválido/corrompido, FR-002) **ou** falha de
  ambos os caminhos de extração — IA e fallback determinístico (FR-012, FR-015);
  `failureReason` populado.

### StatementExtractionMethod

Qual mecanismo efetivamente produziu as `ExtractedTransaction`s de um `StatementImport`
(FR-016).

- `AI` — extraído pelo GPT-5-Mini (research.md, Decisões 1, 3, 10).
- `FALLBACK` — extraído pelo parser determinístico (regex/parsers por formato) porque a IA
  falhou ou estourou o limite de tokens (FR-015, research.md, Decisões 9, 10).

## Entidades

### StatementImport

Representa a submissão de um arquivo de extrato feita pelo usuário (entidade "Extrato
Importado" do spec).

| Campo | Tipo | Regras |
|---|---|---|
| `id` | `String` (uuid) | PK |
| `userId` | `String` | FK → `User.id`; dono da importação (sempre a partir do token, Princípio III) |
| `fileName` | `String` | nome original do arquivo enviado |
| `fileFormat` | `StatementFileFormat` | derivado da extensão/`mimetype` do upload, validado no FR-002 |
| `fileContent` | `Bytes` | conteúdo bruto do arquivo, para permitir nova tentativa sem reenvio (ver research.md item 6) |
| `status` | `StatementImportStatus` | default `RECEIVED` |
| `extractionMethod` | `StatementExtractionMethod?` | populado quando a extração é concluída (sucesso ou `NO_TRANSACTIONS_FOUND`); `null` enquanto `RECEIVED`/`PROCESSING` e permanece `null` se `FAILED` (nenhum dos dois caminhos concluiu) — FR-016 |
| `failureReason` | `String?` | populado apenas quando `status = FAILED` |
| `createdAt` | `DateTime` | default `now()` |
| `confirmedAt` | `DateTime?` | populado quando `status` muda para `CONFIRMED` |

Relações: `1 StatementImport → N ExtractedTransaction`.

Regra de acesso: toda leitura/escrita é escopada por `userId` (`findByIdAndUser`); nunca
exposta/alterada por outro usuário (FR-013).

### ExtractedTransaction

Representa um lançamento identificado pela IA ou pelo parser de fallback determinístico
(`statementImport.extractionMethod` indica qual) a partir do arquivo, antes de virar uma
transação real (entidade "Transação Extraída" do spec).

| Campo | Tipo | Regras |
|---|---|---|
| `id` | `String` (uuid) | PK |
| `statementImportId` | `String` | FK → `StatementImport.id` |
| `date` | `DateTime` | data do lançamento identificada pela IA ou pelo fallback; editável pelo usuário (FR-006) |
| `description` | `String` | editável pelo usuário (FR-006) |
| `amount` | `Decimal(10,2)` | positivo; editável pelo usuário (FR-006) |
| `type` | `TransactionType` (reaproveitado: `INCOME` \| `EXPENSE`) | inferido pela IA ou pelo fallback (FR-004), editável (FR-006) |
| `categoryId` | `String?` | FK → `Category.id`; sugerido pela IA quando há correspondência (ver research.md item 8) — o fallback nunca sugere categoria, sempre `null` —, ajustável/selecionável pelo usuário; **obrigatório no momento da confirmação** (FR-014) |
| `isDuplicate` | `Boolean` | default `false`; calculado deterministicamente na criação (FR-009, research.md item 7) |
| `discarded` | `Boolean` | default `false`; `true` quando o usuário remove o item da pré-visualização (FR-007) — não é DELETE físico, para preservar rastreabilidade do que a IA originalmente extraiu |
| `createdAt` | `DateTime` | default `now()` |

Relações: pertence a um `StatementImport`; opcionalmente origina uma `Transaction` real
(1:1) quando confirmada.

### Transaction (alteração em entidade existente)

Adição de campo opcional para rastrear a origem de uma transação criada via importação,
seguindo o mesmo padrão já usado para `recurringTransactionId`:

| Campo (novo) | Tipo | Regras |
|---|---|---|
| `extractedTransactionId` | `String?` `@unique` | FK → `ExtractedTransaction.id`, `onDelete: SetNull` — preenchido apenas quando a transação foi criada a partir da confirmação de uma importação |

### Category (alteração em entidade existente)

Adição da relação inversa `extractedTransactions ExtractedTransaction[]` (sem novos campos
escalares).

### User (alteração em entidade existente)

Adição da relação inversa `statementImports StatementImport[]` (sem novos campos escalares).

## Regras de validação (consolidado das Functional Requirements)

- `fileFormat` MUST ser um dos seis suportados; qualquer outro valor de extensão/mimetype
  rejeita a criação do `StatementImport` com erro tipado antes de qualquer tentativa de
  extração (IA ou fallback) (FR-002).
- `extractionMethod` só é gravado quando ao menos um dos dois caminhos de extração (IA ou
  fallback) concluir com sucesso; se ambos falharem, `status = FAILED` e `extractionMethod`
  permanece `null` (FR-012, FR-015, FR-016).
- `amount` de uma `ExtractedTransaction`, ao editar (FR-006) ou confirmar, MUST ser positivo
  — mesma regra já aplicada a `Transaction`/`RecurringTransaction`.
- Confirmar um `StatementImport` (transição para `CONFIRMED`) exige que cada
  `ExtractedTransaction` não descartada (`discarded = false`) tenha `categoryId` preenchido;
  caso contrário a confirmação é rejeitada, apontando quais itens ainda precisam de categoria.
- Um `StatementImport` só pode ser confirmado uma vez; tentativas de confirmar um import já
  `CONFIRMED` são rejeitadas (idempotência do lado do domínio).
- Toda leitura/edição/remoção de `ExtractedTransaction` MUST validar que o `StatementImport`
  pai pertence ao usuário autenticado (Princípio III) antes de qualquer operação.

## Diagrama de relações (texto)

```
User 1───N StatementImport 1───N ExtractedTransaction 0..1───0..1 Transaction
                                         │
                                         └──N───1 Category (opcional até confirmação)
```
