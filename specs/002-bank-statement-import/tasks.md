# Tarefas: Importação de Extratos Bancários (Bank Statement Import)

**Entrada**: Documentos de design de `/specs/002-bank-statement-import/`

**Pré-requisitos**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md (todos presentes)

**Testes**: Testes são OBRIGATÓRIOS, não opcionais, conforme a constitution deste projeto
(Princípio X — Testes Automatizados Obrigatórios): todo use case ganha um teste unitário
(repository fake in-memory e fakes de `IStatementFileParser`, sem Prisma/banco nem chamada
real à OpenAI) e toda rota ganha um teste e2e (`app.inject()` contra o banco de teste real,
com o provider de extração trocado pelo fake via `STATEMENT_IMPORT_USE_FAKE_AI_PROVIDER`),
incluindo o cenário de autorização cruzada entre usuários (404, nunca 403) e o contrato de
validação/erro. Não pule as tasks de teste abaixo.

**Organização**: As tasks são agrupadas por user story (spec.md) para permitir implementação
e teste independentes de cada história.

## Formato: `[ID] [P?] [Story] Descrição`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de uma task ainda
  incompleta)
- **[Story]**: US1 = Importar um extrato bancário, US2 = Revisar e confirmar transações antes
  de importar, US3 = Evitar transações duplicadas na importação
- Os caminhos de arquivo são exatos, relativos à raiz do repositório

---

## Fase 1: Setup (Infraestrutura Compartilhada)

**Propósito**: Adicionar as dependências e configurações que esta feature precisa e que
ainda não existem no projeto (research.md, Decisões 1, 2, 4 e 5).

- [X] T001 [P] Adicionar `@fastify/multipart`, `openai`, `xlsx` e `pdf-parse` como
      dependencies ao `package.json` e instalar (research.md, Decisões 1, 2, 5, 9)
- [X] T002 [P] Adicionar `openaiApiKey`, `openaiModel` (default `"gpt-5-mini"`),
      `statementImportMaxFileSizeBytes` (default `10485760`, i.e. 10MB) e `useFakeAiProvider`
      (`process.env.STATEMENT_IMPORT_USE_FAKE_AI_PROVIDER === "true"`) a `src/config/env.ts`
      (research.md, Decisões 1, 4, 11)
- [X] T003 Registrar o plugin `@fastify/multipart` em `src/infra/http/app.ts` com
      `limits.fileSize = env.statementImportMaxFileSizeBytes` (depende de T001, T002;
      research.md, Decisão 5)

---

## Fase 2: Foundational (Pré-requisitos Bloqueantes)

**Propósito**: Schema, entidades, repositories, porta do provider de extração e
infraestrutura de teste das quais todas as user stories dependem.

**⚠️ CRÍTICO**: Nenhuma task de user story pode começar antes desta fase estar completa.

- [X] T004 [P] Adicionar os enums `StatementFileFormat`, `StatementImportStatus` e
      `StatementExtractionMethod`, os models `StatementImport` (incluindo `extractionMethod`)
      e `ExtractedTransaction`, o campo `extractedTransactionId` (+ relação, `onDelete:
      SetNull`) em `Transaction`, e as relações inversas `statementImports` em `User` e
      `extractedTransactions` em `Category`, ao `prisma/schema.prisma`, conforme
      `data-model.md`
- [X] T005 Rodar `npx prisma migrate dev --name add-statement-imports` para gerar e aplicar a
      migration de T004 no banco de desenvolvimento (depende de T004) — `migrate dev` recusou
      rodar por falta de TTY interativo neste ambiente; a migration foi gerada via
      `prisma migrate diff --from-config-datasource --to-schema` e aplicada com
      `prisma migrate deploy` (mesmo resultado: SQL versionado em `prisma/migrations/`)
- [X] T006 [P] Criar a entidade `StatementImport` (props privadas, getters incl.
      `extractionMethod`, `toJSON()` obrigatório) em
      `src/modules/statement-imports/entities/statement-import.ts`, conforme `data-model.md`
      e o Princípio II da constitution
- [X] T007 [P] Criar a entidade `ExtractedTransaction` (props privadas, getters, `toJSON()`
      obrigatório) em `src/modules/statement-imports/entities/extracted-transaction.ts`
- [X] T008 [P] Criar `IStatementImportsRepository` (`create`, `findByIdAndUser`, `update` —
      status/extractionMethod/failureReason/confirmedAt) em
      `src/modules/statement-imports/repositories/istatement-imports-repository.ts`, conforme
      `data-model.md`
- [X] T009 [P] Criar `IExtractedTransactionsRepository` (`createMany`, `findManyByStatementImport`,
      `findByIdAndStatementImport`, `update`) em
      `src/modules/statement-imports/repositories/iextracted-transactions-repository.ts`
- [X] T010 Implementar `PrismaStatementImportsRepository` em
      `src/modules/statement-imports/repositories/prisma/prisma-statement-imports-repository.ts`
      (depende de T006, T008)
- [X] T011 Implementar `PrismaExtractedTransactionsRepository` em
      `src/modules/statement-imports/repositories/prisma/prisma-extracted-transactions-repository.ts`
      (depende de T007, T009)
- [X] T012 [P] Reaproveitar `ResourceNotFoundError` (`core/errors/resource-not-found-error.ts`)
      para os casos de `StatementImport`/`ExtractedTransaction` não encontrados, em vez de criar
      duas subclasses dedicadas — ajuste feito durante a implementação ao notar que o restante
      do projeto (`recurring-transactions`) já reaproveita esse erro genérico do core para o
      mesmo tipo de caso (404 cross-user/inexistente), em vez de duplicar uma subclasse por
      módulo (Princípio IX, YAGNI)
- [X] T013 [P] Criar a porta `IStatementFileParser` (`parse(fileBuffer, format,
      existingCategoryNames): Promise<{ transactions: ParsedTransaction[]; method:
      StatementExtractionMethod }>`, com `ParsedTransaction = { date, description, amount,
      type, suggestedCategoryName? }`) em
      `src/modules/statement-imports/providers/istatement-file-parser.ts` (research.md,
      Decisões 1, 8, 10; justificativa da pasta `providers/` em plan.md, Complexity Tracking)
- [X] T014 [P] Criar a função `statementImportsRoutes(fastify)` vazia em
      `src/modules/statement-imports/infra/http/routes.ts` e registrá-la com o prefixo
      `/v1/statement-imports` em `src/infra/http/app.ts`, seguindo o mesmo padrão de
      `recurringTransactionsRoutes`
- [X] T015 [P] Criar um fake in-memory implementando `IStatementImportsRepository` para os
      testes unitários em
      `tests/unit/modules/statement-imports/in-memory-statement-imports-repository.ts`
      (depende de T008)
- [X] T016 [P] Criar um fake in-memory implementando `IExtractedTransactionsRepository` para
      os testes unitários em
      `tests/unit/modules/statement-imports/in-memory-extracted-transactions-repository.ts`
      (depende de T009)
- [X] T017 [P] Criar `FakeStatementFileParser` configurável (construtor recebe se deve
      suceder ou lançar erro, e a lista de `ParsedTransaction`/`method` a retornar quando
      suceder) para os testes unitários — reutilizado tanto como "primário" quanto como
      "fallback" fake nos testes de `StatementFileParserWithFallback` (T025) e de
      `ImportStatementUseCase` (T021) — em
      `tests/unit/modules/statement-imports/fake-statement-file-parser.ts` (depende de T013;
      research.md, Decisão 11)
- [X] T018 [P] Criar um `FakeStatementFileParser` de uso interno (não apenas em `tests/`) em
      `src/modules/statement-imports/providers/fake/fake-statement-file-parser.ts` — extrai
      transações de forma determinística e simples (ex: linhas `data,descrição,valor,tipo`)
      sem chamar nenhuma API externa, sempre retornando `method: "AI"` — e a factory
      `makeStatementFileParser()` em
      `src/modules/statement-imports/providers/make-statement-file-parser.ts`, que retorna
      esse fake quando `env.useFakeAiProvider` é `true` e, caso contrário, a composição real
      (implementada na US1, T034); os controllers desta feature MUST chamar essa factory em
      vez de instanciar um provider diretamente (depende de T013, T002; research.md, Decisão 11)
- [X] T019 Atualizar `cleanDatabase()` em `tests/e2e/setup.ts` para também limpar
      `extractedTransaction` e `statementImport`, na ordem segura de FK: `transaction` →
      `extractedTransaction` → `statementImport` → `recurringTransaction` → `category` →
      `user` (depende de T005)
- [X] T020 [P] Adicionar `process.env.STATEMENT_IMPORT_USE_FAKE_AI_PROVIDER = "true"` a
      `tests/setup-env.ts`, para que toda a suíte de testes (unitária e e2e) nunca chame a API
      real da OpenAI (research.md, Decisão 11; pareado com T018)

**Checkpoint**: Fundação pronta — a implementação das user stories pode começar.

---

## Fase 3: User Story 1 - Importar um extrato bancário (Prioridade: P1) 🎯 MVP parte 1

**Objetivo**: Um usuário autenticado envia um arquivo (PDF, XLSX, CSV, OFX, BBT ou TXT) e
recebe de volta a lista de transações identificadas pelo GPT-5-Mini — com fallback automático
para extração determinística quando a IA falhar ou estourar o limite de tokens — sem precisar
digitar nada manualmente.

**Teste Independente**: `POST /v1/statement-imports` com um arquivo válido em cada formato
suportado retorna `201` com `extractedTransactions` preenchido e `extractionMethod` indicando
o caminho usado (ou `status: "NO_TRANSACTIONS_FOUND"` quando o arquivo não tem lançamentos),
verificável sem depender de nenhum endpoint das demais user stories.

### Testes da User Story 1 (OBRIGATÓRIO pelo Princípio X da constitution) ⚠️

> Escreva estes testes primeiro; eles devem falhar antes da implementação abaixo.

- [X] T021 [P] [US1] Teste unitário de `ImportStatementUseCase` (caminho feliz cria
      `StatementImport` `READY_FOR_REVIEW` com `extractionMethod` refletindo o retorno do
      parser + `ExtractedTransaction`s com `categoryId` resolvido por nome quando há
      correspondência; lista vazia do parser → `NO_TRANSACTIONS_FOUND` sem itens; formato não
      suportado → `UnsupportedFileFormatError` antes de chamar o parser; arquivo acima do
      limite → `FileTooLargeError`; parser lança erro → `StatementImport` persistido como
      `FAILED` com `failureReason`, `extractionMethod` permanece `null`, e
      `StatementExtractionFailedError` é lançado) em
      `tests/unit/modules/statement-imports/use-cases/import-statement.spec.ts`, usando os
      fakes de T015-T017
- [X] T022 [P] [US1] Teste unitário de `extractStatementText` cobrindo o pré-processamento
      por formato (XLSX convertido para texto via `xlsx`; PDF convertido para texto via
      `pdf-parse`, incluindo o caso de PDF escaneado retornando string vazia; CSV/TXT/BBT/OFX
      lidos como texto, com fallback de encoding) em
      `tests/unit/modules/statement-imports/providers/extract-statement-text.spec.ts`
      (research.md, Decisão 2)
- [X] T023 [P] [US1] Teste unitário de `OpenAIStatementFileParser` com o cliente `openai`
      mockado — nenhuma chamada de rede real — cobrindo o caminho feliz (retorna `method:
      "AI"`) e a revalidação Zod da resposta em
      `tests/unit/modules/statement-imports/providers/openai-statement-file-parser.spec.ts`
      (research.md, Decisões 1, 3)
- [X] T024 [P] [US1] Teste unitário de `DeterministicStatementFileParser` cobrindo cada
      formato (regex de tags para OFX; heurística de colunas para CSV/XLSX; regex genérica de
      data/valor para TXT/BBT/PDF) em
      `tests/unit/modules/statement-imports/providers/deterministic-statement-file-parser.spec.ts`
      (research.md, Decisão 9)
- [X] T025 [P] [US1] Teste unitário de `StatementFileParserWithFallback` (primário sucede →
      retorna `method: "AI"` sem chamar o fallback; primário lança → fallback é chamado e o
      resultado retorna `method: "FALLBACK"`; ambos lançam → o erro do fallback propaga) em
      `tests/unit/modules/statement-imports/providers/statement-file-parser-with-fallback.spec.ts`,
      usando o fake de T017 como primário e como fallback (research.md, Decisão 10)
- [X] T026 [P] [US1] Teste e2e de `POST /v1/statement-imports` (201 com
      `extractedTransactions` para um fixture de cada formato suportado, usando o fake de T018
      via `STATEMENT_IMPORT_USE_FAKE_AI_PROVIDER`; 400 para extensão não suportada; 400 para
      arquivo acima do limite de tamanho; 401 sem autenticação) em
      `tests/e2e/modules/statement-imports/import-statement.e2e.spec.ts`, usando fixtures de
      T058

### Implementação da User Story 1

- [X] T027 [P] [US1] Criar `UnsupportedFileFormatError`, `FileTooLargeError` e
      `StatementExtractionFailedError` (estendem `AppError`, status 400) em
      `src/modules/statement-imports/use-cases/errors/unsupported-file-format-error.ts`,
      `.../file-too-large-error.ts` e `.../statement-extraction-failed-error.ts`
- [X] T028 [P] [US1] Criar o DTO Zod `importStatementSchema` (validação de nome/extensão do
      arquivo contra os seis formatos suportados) em
      `src/modules/statement-imports/dtos/import-statement.dto.ts`, conforme
      `contracts/statement-imports-api.md`
- [X] T029 [US1] Implementar `ImportStatementUseCase` em
      `src/modules/statement-imports/use-cases/import-statement.ts`: valida formato e
      tamanho, persiste `StatementImport` (`RECEIVED`), chama `IStatementFileParser.parse()`,
      mapeia o resultado para `ExtractedTransaction`s (resolvendo `categoryId` via
      `ICategoriesRepository` por nome quando houver `suggestedCategoryName`; `isDuplicate`
      fixo em `false` nesta fase — a checagem real é adicionada na US3, T057), atualiza o
      status para `READY_FOR_REVIEW` ou `NO_TRANSACTIONS_FOUND` e grava `extractionMethod`;
      em caso de falha do parser (IA e fallback), marca `FAILED` com `failureReason` e
      propaga `StatementExtractionFailedError` (depende de T008, T009, T013, T027, T028)
- [X] T030 [US1] Implementar `extractStatementText(fileBuffer, format): Promise<string>` em
      `src/modules/statement-imports/providers/extract-statement-text.ts`: XLSX → texto via
      `xlsx`; PDF → texto via `pdf-parse`; CSV/TXT/BBT/OFX → texto direto com fallback de
      encoding (depende de T013; research.md, Decisão 2)
- [X] T031 [US1] Implementar `OpenAIStatementFileParser` em
      `src/modules/statement-imports/providers/openai/openai-statement-file-parser.ts`: usa
      `extractStatementText` (T030), chama o SDK `openai` com `response_format: { type:
      "json_schema" }`, revalida a resposta com Zod, e retorna `{ transactions, method: "AI"
      }` (depende de T013, T030; research.md, Decisões 1, 3)
- [X] T032 [US1] Implementar `DeterministicStatementFileParser` em
      `src/modules/statement-imports/providers/deterministic/deterministic-statement-file-parser.ts`:
      OFX via regex sobre tags SGML (`<STMTTRN>`/`<DTPOSTED>`/`<TRNAMT>`/`<MEMO>`); CSV/XLSX
      via heurística de colunas (XLSX lido diretamente com `xlsx`, não via `extractStatementText`);
      TXT/BBT/PDF via regex genérica de data/valor sobre o texto de `extractStatementText`
      (T030); nunca preenche `suggestedCategoryName`; retorna `{ transactions, method:
      "FALLBACK" }` (depende de T013, T030; research.md, Decisão 9)
- [X] T033 [US1] Implementar `StatementFileParserWithFallback` em
      `src/modules/statement-imports/providers/statement-file-parser-with-fallback.ts`:
      recebe primário e fallback via construtor, chama o primário, em caso de erro loga e
      chama o fallback, propaga erro apenas se o fallback também lançar (depende de T013,
      T031, T032; research.md, Decisão 10)
- [X] T034 [US1] Ligar o branch "real" da factory `makeStatementFileParser()` (T018) para
      construir `new StatementFileParserWithFallback(new OpenAIStatementFileParser(env.openaiApiKey,
      env.openaiModel), new DeterministicStatementFileParser())` quando `env.useFakeAiProvider`
      for `false` (depende de T018, T033)
- [X] T035 [US1] Implementar `ImportStatementController` em
      `src/modules/statement-imports/infra/http/controllers/import-statement.controller.ts`:
      lê o arquivo multipart via `request.file()`, extrai `userId` de `request.user.sub`,
      instancia manualmente `PrismaStatementImportsRepository` +
      `PrismaExtractedTransactionsRepository` + `PrismaCategoriesRepository` +
      `makeStatementFileParser()` + `ImportStatementUseCase`, retorna `201` com
      `statementImport` + `extractedTransactions` (depende de T029, T034)
- [X] T036 [US1] Adicionar a rota `POST /` ligada a `ImportStatementController` com
      `fastify.authenticate` em `src/modules/statement-imports/infra/http/routes.ts` (depende
      de T003, T014, T035)

**Checkpoint**: User Story 1 completa e testável de forma independente.

---

## Fase 4: User Story 2 - Revisar e confirmar transações antes de importar (Prioridade: P1) 🎯 MVP parte 2

**Objetivo**: Um usuário consegue reconsultar a pré-visualização, editar ou remover itens
extraídos, e confirmar a importação para gerar transações reais — apenas com os itens e
valores presentes no momento da confirmação.

**Teste Independente**: Criar um `StatementImport` com `ExtractedTransaction`s (via
repository/seed direto, sem depender do endpoint `POST` da US1), depois consultar, editar,
remover e confirmar via os endpoints desta história, verificando que só os itens não
descartados viram `Transaction`s reais, com os valores editados.

### Testes da User Story 2 (OBRIGATÓRIO pelo Princípio X da constitution) ⚠️

- [X] T037 [P] [US2] Teste unitário de `FetchStatementImportUseCase` (`findByIdAndUser`;
      `StatementImportNotFoundError` cross-user ou inexistente) em
      `tests/unit/modules/statement-imports/use-cases/fetch-statement-import.spec.ts`
- [X] T038 [P] [US2] Teste unitário de `UpdateExtractedTransactionUseCase` (caminho feliz
      edita campos; not-found cross-user; rejeita edição quando o `StatementImport` já está
      `CONFIRMED`; `CategoryNotFoundError` para `categoryId` inexistente; `amount` deve ser
      positivo) em
      `tests/unit/modules/statement-imports/use-cases/update-extracted-transaction.spec.ts`
- [X] T039 [P] [US2] Teste unitário de `DiscardExtractedTransactionUseCase` (marca
      `discarded = true`; not-found cross-user; rejeita quando o `StatementImport` já está
      `CONFIRMED`) em
      `tests/unit/modules/statement-imports/use-cases/discard-extracted-transaction.spec.ts`
- [X] T040 [P] [US2] Teste unitário de `ConfirmStatementImportUseCase` (cria uma `Transaction`
      por `ExtractedTransaction` não descartada, com os valores já editados, preenchendo
      `extractedTransactionId`; marca `StatementImport` `CONFIRMED` + `confirmedAt`; rejeita
      quando algum item não descartado está sem `categoryId`; rejeita reconfirmar um import já
      `CONFIRMED`; not-found cross-user) em
      `tests/unit/modules/statement-imports/use-cases/confirm-statement-import.spec.ts`
- [X] T041 [P] [US2] Teste e2e de `GET /v1/statement-imports/:id` (200 caminho feliz, 404
      cross-user, 401 sem autenticação) em
      `tests/e2e/modules/statement-imports/fetch-statement-import.e2e.spec.ts`
- [X] T042 [P] [US2] Teste e2e de
      `PATCH /v1/statement-imports/:id/extracted-transactions/:extractedTransactionId` (200
      caminho feliz, 400 `amount`/`categoryId` inválidos, 404 cross-user) em
      `tests/e2e/modules/statement-imports/update-extracted-transaction.e2e.spec.ts`
- [X] T043 [P] [US2] Teste e2e de
      `DELETE /v1/statement-imports/:id/extracted-transactions/:extractedTransactionId` (204
      caminho feliz, 404 cross-user) em
      `tests/e2e/modules/statement-imports/discard-extracted-transaction.e2e.spec.ts`
- [X] T044 [P] [US2] Teste e2e de `POST /v1/statement-imports/:id/confirm` (200 caminho feliz
      criando transações reais visíveis via `GET /v1/transactions`; 400 quando falta
      categoria em algum item; 404 cross-user) em
      `tests/e2e/modules/statement-imports/confirm-statement-import.e2e.spec.ts`

### Implementação da User Story 2

- [X] T045 [P] [US2] Criar o DTO Zod `updateExtractedTransactionSchema` (todos os campos
      opcionais, ao menos um obrigatório, `amount` positivo quando informado) em
      `src/modules/statement-imports/dtos/update-extracted-transaction.dto.ts`
- [X] T046 [P] [US2] Criar `CategoryNotFoundError`, `StatementImportAlreadyConfirmedError` e
      `MissingCategoryForConfirmationError` (estendem `AppError`, status 400/404 conforme o
      caso) em
      `src/modules/statement-imports/use-cases/errors/category-not-found-error.ts`,
      `.../statement-import-already-confirmed-error.ts` e
      `.../missing-category-for-confirmation-error.ts`
- [X] T047 [US2] Implementar `FetchStatementImportUseCase` (`findByIdAndUser` incluindo as
      `ExtractedTransaction`s) em
      `src/modules/statement-imports/use-cases/fetch-statement-import.ts` (depende de T008,
      T009)
- [X] T048 [US2] Implementar `UpdateExtractedTransactionUseCase` em
      `src/modules/statement-imports/use-cases/update-extracted-transaction.ts` (depende de
      T009, T045, T046)
- [X] T049 [US2] Implementar `DiscardExtractedTransactionUseCase` em
      `src/modules/statement-imports/use-cases/discard-extracted-transaction.ts` (depende de
      T009, T046)
- [X] T050 [US2] Adicionar `extractedTransactionId` (opcional) a `TransactionCreateData`, à
      entidade `Transaction` e ao mapeamento de `PrismaTransactionsRepository.create()`,
      seguindo o mesmo padrão já usado para `recurringTransactionId`; atualizar o fake
      in-memory correspondente — arquivos:
      `src/modules/transactions/entities/transaction.ts`,
      `src/modules/transactions/repositories/itransactions-repository.ts`,
      `src/modules/transactions/repositories/prisma/prisma-transactions-repository.ts`,
      `tests/unit/modules/transactions/in-memory-transactions-repository.ts`
- [X] T051 [US2] Implementar `ConfirmStatementImportUseCase` em
      `src/modules/statement-imports/use-cases/confirm-statement-import.ts`: valida que todo
      item não descartado tem `categoryId`, cria uma `Transaction` por item via
      `ITransactionsRepository.create` (com `extractedTransactionId`), atualiza
      `StatementImport` para `CONFIRMED`/`confirmedAt` (depende de T008, T009, T046, T050)
- [X] T052 [P] [US2] Implementar `FetchStatementImportController`,
      `UpdateExtractedTransactionController`, `DiscardExtractedTransactionController` e
      `ConfirmStatementImportController` em
      `src/modules/statement-imports/infra/http/controllers/fetch-statement-import.controller.ts`,
      `.../update-extracted-transaction.controller.ts`,
      `.../discard-extracted-transaction.controller.ts` e
      `.../confirm-statement-import.controller.ts` (depende de T047-T049, T051)
- [X] T053 [US2] Adicionar as rotas `GET /:id`,
      `PATCH /:id/extracted-transactions/:extractedTransactionId`,
      `DELETE /:id/extracted-transactions/:extractedTransactionId` e `POST /:id/confirm`
      ligadas aos controllers de T052, cada uma com `fastify.authenticate`, em
      `src/modules/statement-imports/infra/http/routes.ts` (depende de T036, T052)

**Checkpoint**: User Stories 1 e 2 completas — fluxo de importar, revisar e confirmar
funcional de ponta a ponta (MVP da feature).

---

## Fase 5: User Story 3 - Evitar transações duplicadas na importação (Prioridade: P2)

**Objetivo**: Transações extraídas que já existem no histórico do usuário (mesma data, valor
e descrição) são sinalizadas como possíveis duplicatas na pré-visualização, sem bloquear a
confirmação — independente de terem sido extraídas via IA ou via fallback.

**Teste Independente**: Importar e confirmar um extrato, depois reimportar o mesmo arquivo (ou
um com sobreposição), e verificar que os itens repetidos vêm com `isDuplicate: true` na nova
pré-visualização.

### Testes da User Story 3 (OBRIGATÓRIO pelo Princípio X da constitution) ⚠️

- [X] T054 [P] [US3] Estender o teste unitário de `ImportStatementUseCase` (T021) com casos de
      deduplicação: uma `Transaction` existente do mesmo usuário com mesma data, valor e
      descrição normalizada (case-insensitive, sem acentos, trim) faz a `ExtractedTransaction`
      correspondente nascer com `isDuplicate: true`; sem correspondência,
      `isDuplicate: false` em
      `tests/unit/modules/statement-imports/use-cases/import-statement.spec.ts`
- [X] T055 [P] [US3] Teste e2e: importar e confirmar um extrato, reimportar o mesmo arquivo, e
      verificar via `GET /v1/statement-imports/:novoId` que os itens repetidos vêm com
      `isDuplicate: true` em
      `tests/e2e/modules/statement-imports/duplicate-detection.e2e.spec.ts`

### Implementação da User Story 3

- [X] T056 [US3] Adicionar `findManyForDuplicateCheck(userId, candidates: { date, amount,
      description }[])` a `ITransactionsRepository` (comparação por data, valor e descrição
      normalizada) e implementá-lo em `PrismaTransactionsRepository`; adicionar o método
      correspondente ao fake in-memory — arquivos:
      `src/modules/transactions/repositories/itransactions-repository.ts`,
      `src/modules/transactions/repositories/prisma/prisma-transactions-repository.ts`,
      `tests/unit/modules/transactions/in-memory-transactions-repository.ts` (depende de T050)
- [X] T057 [US3] Em `ImportStatementUseCase`, após mapear as `ParsedTransaction` em candidatos
      a `ExtractedTransaction`, chamar `ITransactionsRepository.findManyForDuplicateCheck` e
      preencher `isDuplicate` de cada item antes de persistir, substituindo o valor fixo
      `false` de T029 — `src/modules/statement-imports/use-cases/import-statement.ts` (depende
      de T029, T056)

**Checkpoint**: As três user stories funcionam de ponta a ponta — feature completa.

---

## Fase 6: Polimento & Preocupações Transversais

**Propósito**: Validação final e revisão de conformidade.

- [X] T058 [P] Criar arquivos de fixture de exemplo para os seis formatos suportados (PDF,
      XLSX, CSV, OFX, BBT, TXT), com lançamentos conhecidos, em
      `tests/e2e/modules/statement-imports/fixtures/`, para uso em T026, T055 e na validação
      manual do quickstart
- [X] T059 [P] Rodar os oito cenários de `quickstart.md` de ponta a ponta contra o banco de
      desenvolvimento local — ao menos uma vez com `env.useFakeAiProvider = false` e uma
      `OPENAI_API_KEY` real, para validar a integração de fato com o GPT-5-Mini e o
      acionamento real do fallback determinístico (Cenário 7, com a chave inválida) —
      **parcialmente concluído**: subi o servidor de dev real (`tsx src/infra/http/server.ts`)
      com `STATEMENT_IMPORT_USE_FAKE_AI_PROVIDER=true` e validei via `curl` real (não
      `app.inject()`) o fluxo de registro/login/categoria/`POST /v1/statement-imports` com
      upload multipart de verdade — os Cenários 1-6 e 8 já estão cobertos automaticamente
      pela suíte e2e (que também bate no banco real). Não havia uma `OPENAI_API_KEY` real
      disponível neste ambiente para validar a chamada de fato ao GPT-5-Mini nem o
      acionamento do fallback por uma falha real da OpenAI (Cenário 7) — isso fica pendente
      para quando o usuário configurar a chave em `.env`
- [X] T060 Revisar todos os arquivos novos em relação aos Princípios I, II, III, IV, V, VI e
      VIII da constitution (imports relativos; `toJSON()` nas novas entidades; `userId`
      sempre de `request.user.sub`; nenhum use case/controller/entidade importa o Prisma
      Client diretamente; controllers instanciam repository/provider/use case manualmente sem
      container de DI; nenhum try/catch de erro de negócio em controller) — verificado via
      grep dirigido (nenhum uso do alias `@/`, nenhum import de `infra/database/prisma` fora
      de `repositories/prisma/`, nenhuma comparação `error.message === `); o único
      `try/catch` em um controller (`ImportStatementController`) captura
      `RequestFileTooLargeError` do `@fastify/multipart` — um erro de infraestrutura da
      camada de upload, anterior a qualquer use case, traduzido para `FileTooLargeError`
      tipado — não um erro de negócio de use case, portanto não viola o Princípio IV. Também
      validado: `npm run build` compila sem erros e o servidor compilado
      (`node dist/infra/http/server.js`) responde corretamente a uma rota real via `curl`.

---

## Dependências & Ordem de Execução

### Dependências entre Fases

- **Setup (Fase 1)**: sem dependências — pode começar imediatamente
- **Foundational (Fase 2)**: depende da conclusão do Setup — BLOQUEIA todas as user stories
- **User Story 1 (Fase 3)**: depende apenas do Foundational
- **User Story 2 (Fase 4)**: depende do Foundational; T053 depende de T036 (US1) porque ambas
  escrevem em `routes.ts`, mas os use cases/controllers de US2 (T045-T052) podem ser
  desenvolvidos em paralelo à User Story 1
- **User Story 3 (Fase 5)**: depende do Foundational e de T029/T050 (US1/US2, pois estende
  `ImportStatementUseCase` e `ITransactionsRepository`) — não pode começar antes de T029 e
  T050 estarem prontos, mas não depende do restante de US2
- **Polimento (Fase 6)**: depende de todas as user stories desejadas estarem completas

### Dentro de Cada User Story

- Testes MUST ser escritos e falhar antes da implementação correspondente
- Erros/DTOs antes dos use cases; use cases antes dos controllers; controllers antes das
  routes; `extractStatementText` (T030) antes dos dois parsers que a consomem (T031, T032);
  os dois parsers (T031, T032) antes da composição (T033)
- História completa e validada antes de mover para a próxima prioridade

### Oportunidades de Paralelismo

- Todas as tasks [P] da Fase 1 podem rodar em paralelo (arquivos diferentes)
- Na Fase 2, T004/T006/T007/T008/T009/T012/T013/T014 podem rodar em paralelo entre si; T010
  depende de T006+T008; T011 depende de T007+T009; T015-T018/T020 podem rodar em paralelo
  assim que suas dependências diretas estiverem prontas
- Na Fase 3, os testes T021-T026 podem rodar em paralelo entre si (arquivos diferentes); na
  implementação, T031 e T032 podem ser desenvolvidos em paralelo assim que T030 estiver pronto
- Uma vez concluído o Foundational, User Story 1 e User Story 3 (na parte que só depende do
  Foundational) podem ser desenvolvidas em paralelo por pessoas diferentes; User Story 2 pode
  ter seus use cases/controllers desenvolvidos em paralelo à US1, faltando apenas T053 (routes)
- Dentro de cada história, todos os testes marcados [P] podem rodar em paralelo entre si, e
  todos os controllers marcados [P] (US2, T052) podem ser implementados em paralelo entre si

---

## Exemplo de Paralelismo: User Story 1 (providers)

```bash
# Depois de extractStatementText (T030) pronto:
Task: "Implementar OpenAIStatementFileParser em .../providers/openai/openai-statement-file-parser.ts"
Task: "Implementar DeterministicStatementFileParser em .../providers/deterministic/deterministic-statement-file-parser.ts"

# Testes da User Story 1 em paralelo:
Task: "Teste unitário de ImportStatementUseCase em tests/unit/.../import-statement.spec.ts"
Task: "Teste unitário de extractStatementText em tests/unit/.../extract-statement-text.spec.ts"
Task: "Teste unitário de OpenAIStatementFileParser em tests/unit/.../openai-statement-file-parser.spec.ts"
Task: "Teste unitário de DeterministicStatementFileParser em tests/unit/.../deterministic-statement-file-parser.spec.ts"
Task: "Teste unitário de StatementFileParserWithFallback em tests/unit/.../statement-file-parser-with-fallback.spec.ts"
```

---

## Estratégia de Implementação

### MVP Primeiro (User Stories 1 + 2)

1. Completar Fase 1: Setup
2. Completar Fase 2: Foundational (bloqueia todas as histórias)
3. Completar Fase 3: User Story 1 (importar e extrair, com fallback)
4. Completar Fase 4: User Story 2 (revisar, editar, descartar, confirmar)
5. **PARAR e VALIDAR**: rodar os Cenários 1, 2, 3, 4, 6, 7 e 8 de `quickstart.md` — o fluxo
   completo de importação já entrega valor (usuário importa e confirma extratos, com
   resiliência a falha da IA) mesmo sem a sinalização de duplicatas
6. Deploy/demo se pronto

### Entrega Incremental

1. Setup + Foundational → base pronta
2. User Story 1 → testar isoladamente → extração (IA + fallback) funcionando
3. User Story 2 → testar isoladamente → fluxo completo de importação (MVP)
4. User Story 3 → testar isoladamente (Cenário 5 de `quickstart.md`) → deduplicação
   funcionando
5. Cada história agrega valor sem quebrar as anteriores

### Estratégia com Time em Paralelo

Com mais de uma pessoa disponível:

1. Time completa Setup + Foundational junto
2. Depois do Foundational:
   - Pessoa A: User Story 1 (inclui os adapters de IA e fallback, a parte mais pesada da
     feature)
   - Pessoa B: use cases/controllers de User Story 2 (T045-T052), entrando em T053 assim que
     a Pessoa A concluir T036
   - Pessoa C: entra em User Story 3 assim que T029 (US1) e T050 (US2) estiverem prontos

---

## Notas

- [P] = arquivos diferentes, sem dependência de uma task ainda incompleta
- [Story] mapeia a task para a user story correspondente, para rastreabilidade
- Nenhum teste (unitário ou e2e) chama a API real da OpenAI — todos usam
  `IStatementFileParser` fake, conforme `STATEMENT_IMPORT_USE_FAKE_AI_PROVIDER` (research.md,
  Decisão 11); T059 é a única validação manual que usa a API real, fora da suíte automatizada
- O fallback determinístico (T032) nunca chama nenhuma API externa — é puramente
  regex/parsing local, por isso não precisa de fake próprio além do já coberto por T017/T024
- Verifique que os testes falham antes de implementar
- Faça commit após cada task ou grupo lógico de tasks
- Pare em qualquer checkpoint para validar a história isoladamente
