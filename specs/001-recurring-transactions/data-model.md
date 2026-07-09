# Data Model: Recorrências (Recurring Transactions)

## RecurringTransaction

Representa um padrão de receita ou despesa que se repete no tempo e que, periodicamente,
gera uma `Transaction` real (FR-001, FR-009).

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `string` (UUID) | sim | Identificador único. |
| `description` | `string` | sim | Descrição da recorrência (ex: "Aluguel", "Netflix"). |
| `amount` | `Decimal(10,2)` | sim | Valor por ciclo, mesma precisão de `Transaction.amount`. MUST ser > 0 (FR-002). |
| `type` | `RecurringTransactionType` (`INCOME` \| `EXPENSE`) | sim | Mesmo enum de `TransactionType`, para consistência com `Transaction`/`Category`. |
| `frequency` | `RecurringTransactionFrequency` (`DAILY` \| `WEEKLY` \| `MONTHLY` \| `YEARLY`) | sim | Periodicidade de geração (FR-002, FR-011). |
| `startDate` | `DateTime` | sim | Data do primeiro ciclo elegível (inclusive — ver Assumption do spec). |
| `endDate` | `DateTime?` | não | Última data elegível para geração (inclusive). Após essa data, nenhum novo ciclo é gerado (FR-011). |
| `lastGeneratedDate` | `DateTime?` | não | Data do último ciclo já processado. `null` = nenhum ciclo gerado ainda. Usada como cursor de retomada (research.md, Decisão 1). |
| `userId` | `string` | sim | Dono da recorrência; toda consulta de alteração/remoção é escopada por este campo (FR-007). |
| `categoryId` | `string` | sim | Categoria associada; validada apenas quanto à existência (research.md, Decisão 5). |
| `createdAt` | `DateTime` | sim | Auditoria. |
| `updatedAt` | `DateTime` | sim | Auditoria. |

### Validation rules

- `amount` MUST ser um valor positivo (FR-002).
- `type` MUST ser `INCOME` ou `EXPENSE`.
- `frequency` MUST ser um dos quatro valores suportados.
- `categoryId` MUST referenciar uma `Category` existente.
- `endDate`, quando informado, MUST ser posterior a `startDate`.
- `userId` nunca é aceito do corpo da requisição — sempre derivado de `request.user.sub`
  (Princípio III da constitution).

### State (implícito, não é uma coluna de status)

Não há uma coluna de "status" explícita — o estado de uma recorrência é derivado das datas:

- **Pendente futura**: `startDate` > hoje → nenhum ciclo gerado ainda (FR-008).
- **Ativa**: `startDate` <= hoje **e** (`endDate` é nulo **ou** `endDate` >= hoje) → elegível
  para gerar ciclos vencidos.
- **Encerrada**: `endDate` < hoje → não gera mais ciclos, mas permanece consultável
  (histórico) até ser removida pelo usuário (FR-011).
- **Removida**: exclusão via `DELETE`, deixa de existir e de gerar novos ciclos (FR-006,
  FR-012); transações já geradas anteriormente não são afetadas (Assumption do spec).

## Relacionamentos

- `RecurringTransaction.userId` → `User.id` (muitos-para-um; já existe `User` no schema).
- `RecurringTransaction.categoryId` → `Category.id` (muitos-para-um; já existe `Category`).
- Cada ciclo processado de uma `RecurringTransaction` produz uma `Transaction` (um-para-muitos
  ao longo do tempo), via `Transaction.recurringTransactionId` (opcional). Isso preserva a
  rastreabilidade de qual recorrência originou qual transação — transações lançadas
  manualmente pelo usuário (fora do processo automático) simplesmente têm esse campo `null`.
  `onDelete: SetNull` garante que remover uma recorrência (FR-006) não apaga nem bloqueia a
  remoção das transações já geradas por ela — elas só perdem a referência, permanecendo
  intactas no histórico do usuário (Assumption do spec).

## Prisma Schema (trecho a adicionar)

```prisma
model RecurringTransaction {
    id          String                         @id @default(uuid())
    description String
    amount      Decimal                        @db.Decimal(10, 2)
    type        TransactionType
    frequency   RecurringTransactionFrequency

    startDate         DateTime
    endDate           DateTime?
    lastGeneratedDate DateTime?

    userId String
    user   User   @relation(fields: [userId], references: [id])

    categoryId String
    category   Category @relation(fields: [categoryId], references: [id])

    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    transactions Transaction[]
}

enum RecurringTransactionFrequency {
    DAILY
    WEEKLY
    MONTHLY
    YEARLY
}
```

Reaproveita o enum `TransactionType` (`INCOME` \| `EXPENSE`) já existente — sem necessidade de
um novo enum para o tipo. `User` e `Category` precisam da relação inversa
(`recurringTransactions RecurringTransaction[]`) adicionada aos seus models.

Adicionalmente, o model `Transaction` (já existente) ganha:

```prisma
model Transaction {
    // ...campos já existentes...

    recurringTransactionId String?
    recurringTransaction   RecurringTransaction? @relation(fields: [recurringTransactionId], references: [id], onDelete: SetNull)
}
```

Esse campo é preenchido apenas pelo processo automático (`ProcessRecurringTransactionsUseCase`,
ver User Story 3); transações criadas manualmente pelo usuário via
`POST /v1/transactions` continuam com `recurringTransactionId = null`.
