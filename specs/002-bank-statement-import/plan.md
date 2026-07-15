# Implementation Plan: Importação de Extratos Bancários (Bank Statement Import)

**Branch**: `002-bank-statement-import` | **Date**: 2026-07-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-bank-statement-import/spec.md`

## Summary

Permitir que um usuário autenticado envie um arquivo de extrato bancário (PDF, XLSX, CSV,
OFX, BBT ou TXT), tenha seu conteúdo interpretado pelo OpenAI GPT-5-Mini para extrair os
lançamentos (data, descrição, valor, tipo) — com fallback automático para uma extração
determinística (regex/parsers por formato) quando a IA falhar ou estourar o limite de tokens
—, revise/edite/remova itens numa pré-visualização, e confirme a importação para gerar
transações reais — com sinalização de possíveis duplicatas frente ao histórico já existente do
usuário. Implementado como um novo módulo de domínio (`statement-imports`) seguindo a
arquitetura já estabelecida no projeto, com providers isolados para a integração com a IA e
para o fallback determinístico (para manter os use cases testáveis sem depender de nenhum
serviço externo real).

## Technical Context

**Language/Version**: TypeScript (Node.js), `strict: true`, mesmo runtime já usado no
projeto (`tsx` em dev, `tsc` para build de produção).

**Primary Dependencies**: Fastify v5 (rotas), Zod (validação de dtos), Prisma 7 + `@prisma/adapter-pg`
(persistência), `@fastify/jwt` (autenticação já existente). Novas dependências necessárias
para esta feature: `@fastify/multipart` (upload de arquivo via multipart/form-data), `openai`
(SDK oficial da OpenAI para o GPT-5-Mini), `xlsx` (conversão de planilhas XLSX para uma
representação textual/tabular), `pdf-parse` (extração de texto de arquivos PDF, reaproveitada
tanto pelo caminho de IA quanto pelo fallback determinístico).

**Storage**: PostgreSQL via Prisma. O conteúdo bruto do arquivo importado é persistido como
`Bytes` na própria tabela do import (sem serviço de object storage externo), permitindo
reprocessamento sem exigir reenvio do arquivo pelo usuário.

**Testing**: Vitest. Unitário: use cases com repository fake em memória e fakes do provider de
extração (um simulando sucesso da IA, outro simulando falha da IA seguida de sucesso do
fallback, outro simulando falha de ambos — nenhuma chamada real à OpenAI em teste unitário).
E2E: `app.inject()` do Fastify contra banco de teste real, com o provider de extração
substituído por uma implementação fake injetada no bootstrap de teste (nenhuma chamada real à
OpenAI em e2e).

**Target Platform**: Servidor Node.js (mesmo alvo de deploy já usado pelo projeto, Render).

**Project Type**: Web service (API backend apenas; não há frontend neste repositório).

**Performance Goals**: Pré-visualização disponível em até 30s após o envio do arquivo, para
extratos de tamanho típico (até algumas centenas de lançamentos) — ver SC-001 do spec.

**Constraints**: Processamento síncrono do ponto de vista do usuário (sem fila/worker em
background nesta primeira versão); tamanho máximo de arquivo por importação limitado (ver
research.md) para manter o processamento dentro da janela síncrona e dos limites de
payload/tokens da OpenAI; extração MUST cair automaticamente para o parser determinístico
quando a IA falhar ou estourar o limite de tokens (FR-015), nunca expondo isso como erro ao
usuário enquanto o fallback não tiver sido tentado (FR-012).

**Scale/Scope**: Uso por usuário autenticado individual, um arquivo por vez, extratos
pessoais (não processamento em lote de múltiplos arquivos simultâneos nesta versão).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Princípio I (Arquitetura por Domínio)**: Novo módulo `src/modules/statement-imports/`
  seguindo `dtos/entities/repositories/use-cases/infra/http`. PASS — ver nota sobre
  `providers/` em Complexity Tracking.
- **Princípio II (Entidades sem vazamento)**: `StatementImport` e `ExtractedTransaction`
  terão `toJSON()` explícito. PASS.
- **Princípio III (Identidade via token)**: todo acesso a `StatementImport`/
  `ExtractedTransaction` é escopado por `userId` vindo de `request.user.sub`, nunca do body;
  buscas usam padrão `findByIdAndUser`, retornando 404 quando não pertence ao usuário. PASS.
- **Princípio IV (Erros tipados)**: novos erros em
  `modules/statement-imports/use-cases/errors/` (`UnsupportedFileFormatError`,
  `FileTooLargeError`, `StatementExtractionFailedError` — lançado apenas quando IA e fallback
  falham (FR-012, FR-015) —, `StatementImportNotFoundError`,
  `ExtractedTransactionNotFoundError`, `StatementImportAlreadyConfirmedError`,
  `MissingCategoryForConfirmationError`, `CategoryNotFoundError` reaproveitado do padrão de
  recurring-transactions). PASS.
- **Princípio V (Repository como única porta de dados)**: `IStatementImportsRepository` e
  `IExtractedTransactionsRepository` com implementação Prisma; nenhum use case importa o
  Prisma Client diretamente. PASS.
- **Princípio VI (DI manual)**: controllers instanciam repository + provider + use case
  diretamente, sem container de DI. PASS.
- **Princípio VII (moduleFormat do Prisma)**: nenhuma mudança no generator; novos models
  apenas estendem o schema existente. PASS.
- **Princípio VIII (imports relativos)**: sem uso do alias `@/`. PASS.
- **Princípio IX (Simplicidade/YAGNI)**: nenhuma fila/worker, nenhum object storage externo,
  nenhum container de DI introduzido; ver Complexity Tracking para a única adição estrutural
  (`providers/`) e sua justificativa.
- **Princípio X (Testes obrigatórios)**: todo use case novo terá teste unitário (caminho
  feliz + cada erro), toda rota nova terá teste e2e cobrindo sucesso, contrato de erro e
  autorização cruzada (usuário A não acessa import de usuário B).

Nenhuma violação sem justificativa identificada. Gate: **PASS**.

### Re-check pós Fase 1 (design)

Após produzir `data-model.md` e `contracts/statement-imports-api.md`, o desenho não
introduziu nenhum elemento novo além do previsto acima (nenhuma fila, nenhum container de
DI, nenhum object storage externo, nenhuma camada cross-domínio). O único ponto já sinalizado
(`providers/`) permanece a única entrada em Complexity Tracking. Gate: **PASS** (mantido).

## Project Structure

### Documentation (this feature)

```text
specs/002-bank-statement-import/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
prisma/
└── schema.prisma        # + StatementImport, ExtractedTransaction, StatementFileFormat,
                          #   StatementImportStatus; + campos de relação em User, Category,
                          #   Transaction

src/modules/statement-imports/
├── dtos/
│   ├── import-statement.dto.ts            # metadados do arquivo (nome, formato) — Zod
│   └── update-extracted-transaction.dto.ts
├── entities/
│   ├── statement-import.ts
│   └── extracted-transaction.ts
├── repositories/
│   ├── istatement-imports-repository.ts
│   ├── iextracted-transactions-repository.ts
│   └── prisma/
│       ├── prisma-statement-imports-repository.ts
│       └── prisma-extracted-transactions-repository.ts
├── providers/
│   ├── istatement-file-parser.ts           # porta: (fileBuffer, format, categorias) =>
│   │                                        # { transactions, method: "AI" | "FALLBACK" }
│   ├── extract-statement-text.ts           # texto compartilhado por formato (research.md, Decisão 2)
│   ├── openai/
│   │   └── openai-statement-file-parser.ts # adapter usando o SDK `openai` (GPT-5-Mini)
│   ├── deterministic/
│   │   └── deterministic-statement-file-parser.ts # fallback regex/parsers por formato (research.md, Decisão 9)
│   ├── statement-file-parser-with-fallback.ts # composição IA → fallback (research.md, Decisão 10)
│   ├── fake/
│   │   └── fake-statement-file-parser.ts   # fake determinístico simples, usado via factory em teste (não em produção)
│   └── make-statement-file-parser.ts       # factory: fake em teste, IA+fallback em produção
├── use-cases/
│   ├── errors/
│   │   ├── unsupported-file-format-error.ts
│   │   ├── file-too-large-error.ts
│   │   ├── statement-extraction-failed-error.ts   # só quando IA E fallback falham
│   │   ├── statement-import-not-found-error.ts
│   │   ├── extracted-transaction-not-found-error.ts
│   │   ├── category-not-found-error.ts
│   │   ├── statement-import-already-confirmed-error.ts
│   │   └── missing-category-for-confirmation-error.ts
│   ├── import-statement.ts                # cria StatementImport, chama parser, persiste
│   │                                       # ExtractedTransactions + flag de duplicata + extractionMethod
│   ├── fetch-statement-import.ts          # retorna import + extracted transactions (escopado por usuário)
│   ├── update-extracted-transaction.ts    # edita campos antes da confirmação
│   ├── discard-extracted-transaction.ts   # remove item da pré-visualização
│   └── confirm-statement-import.ts        # cria Transactions reais a partir dos itens não descartados
└── infra/http/
    ├── controllers/
    │   ├── import-statement.controller.ts
    │   ├── fetch-statement-import.controller.ts
    │   ├── update-extracted-transaction.controller.ts
    │   ├── discard-extracted-transaction.controller.ts
    │   └── confirm-statement-import.controller.ts
    └── routes.ts

src/infra/http/app.ts    # + registro de @fastify/multipart + statementImportsRoutes
src/config/env.ts        # + OPENAI_API_KEY, OPENAI_MODEL, tamanho máximo de arquivo, flag de fake provider

tests/ (ou equivalente já usado pelo projeto para specs de use case/e2e, seguindo o padrão
        já existente em transactions/recurring-transactions)
```

**Structure Decision**: Web service single-project (API backend). Novo módulo de domínio
`src/modules/statement-imports/` seguindo exatamente o padrão dos módulos existentes
(`transactions`, `recurring-transactions`), com uma pasta `providers/` adicional dentro do
módulo para a integração com IA — justificada em Complexity Tracking abaixo.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|---------------------------------------|
| Pasta `providers/` dentro do módulo (não listada explicitamente no Princípio I) | A OpenAI é um serviço externo de IA, não um banco de dados — não se encaixa em `repositories/` (porta de dados via Prisma). Uma interface (`IStatementFileParser`) + adapters (OpenAI, fallback determinístico, composição dos dois) permite ao use case `import-statement` depender de uma única abstração, e não de nenhum SDK concreto. | Chamar o SDK da OpenAI diretamente dentro do use case foi rejeitado porque tornaria impossível testar `import-statement` unitariamente com um fake (violando o Princípio X, que exige teste unitário do caminho feliz e de cada erro sem depender de serviço externo real). |
| Composição de dois adapters (`StatementFileParserWithFallback`) em vez de um único parser | FR-015 exige que a falha da IA (erro de serviço ou estouro de limite de tokens) acione automaticamente uma extração determinística, sem expor isso como erro; um objeto de composição, e não um `if/else` dentro do use case, mantém `import-statement.ts` alheio a qual provider respondeu. | Colocar o `try/catch` de fallback dentro do próprio use case foi rejeitado por vazar uma decisão de infraestrutura (qual provider chamar) para a camada de aplicação — o mesmo raciocínio que já justifica a existência da porta `IStatementFileParser` acima. |
