# Tarefas: Recorrências (Recurring Transactions)

**Entrada**: Documentos de design de `/specs/001-recurring-transactions/`

**Pré-requisitos**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md (todos presentes)

**Testes**: Testes são OBRIGATÓRIOS, não opcionais, conforme a constitution deste projeto
(Princípio X — Testes Automatizados Obrigatórios): todo use case ganha um teste unitário
(repository fake in-memory, sem Prisma/banco) e toda rota ganha um teste e2e
(`app.inject()` contra o banco de teste real), incluindo o cenário de autorização cruzada
entre usuários (404, nunca 403) e o contrato de validação/erro. Não pule as tasks de teste
abaixo.

**Organização**: As tasks são agrupadas por user story (spec.md) para permitir implementação
e teste independentes de cada história.

## Formato: `[ID] [P?] [Story] Descrição`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de uma task ainda
  incompleta)
- **[Story]**: US1 = Cadastrar uma recorrência, US2 = Consultar/editar/remover recorrências,
  US3 = Geração automática das transações devidas
- Os caminhos de arquivo são exatos, relativos à raiz do repositório

---

## Fase 1: Setup (Infraestrutura Compartilhada)

**Propósito**: Adicionar o ferramental de teste e o schema que esta feature precisa, nada do
que ainda existe no projeto (research.md, Decisões 3 e 4).

- [X] T001 [P] Adicionar `vitest` e `@vitest/coverage-v8` como devDependencies, criar um
      `vitest.config.ts` mínimo na raiz do repositório, e adicionar os scripts `"test": "vitest run"`
      e `"jobs:process-recurring-transactions": "tsx src/infra/jobs/process-recurring-transactions.job.ts"`
      ao `package.json` (research.md, Decisões 3 e 4)
- [X] T002 [P] Adicionar uma entrada `DATABASE_URL_TEST` ao `.env`, apontando para um banco
      `controle-mais-db-test` separado, no mesmo container Postgres já definido em
      `docker-compose.yml` (research.md, Decisão 4)
- [X] T003 [P] Adicionar o model `RecurringTransaction` e o enum
      `RecurringTransactionFrequency` ao `prisma/schema.prisma`, mais as relações inversas
      (`recurringTransactions RecurringTransaction[]`) nos models `User` e `Category`,
      conforme o trecho de schema em `data-model.md`
- [X] T004 Rodar `npx prisma migrate dev --name create-recurring-transactions` para gerar e
      aplicar a migration de T003 no banco de desenvolvimento

---

## Fase 2: Foundational (Pré-requisitos Bloqueantes)

**Propósito**: Estrutura base do módulo e infraestrutura de teste das quais todas as user
stories dependem.

**⚠️ CRÍTICO**: Nenhuma task de user story pode começar antes desta fase estar completa.

- [X] T005 [P] Criar `IRecurringTransactionsRepository` (com os tipos
      `RecurringTransactionCreateData`, `RecurringTransactionUpdateData`, e os métodos
      `create`, `update`, `delete`, `findByIdAndUser`, `findManyByUser`) em
      `src/modules/recurring-transactions/repositories/irecurring-transactions-repository.ts`,
      conforme `data-model.md` (apenas a superfície de CRUD — `findManyDue` é adicionado na
      Fase 5 para a US3)
- [X] T006 [P] Criar a entidade `RecurringTransaction` (props privadas, getters, `toJSON()`
      obrigatório) em `src/modules/recurring-transactions/entities/recurring-transaction.ts`,
      conforme `data-model.md` e o Princípio II da constitution
- [X] T007 Implementar `PrismaRecurringTransactionsRepository` implementando
      `IRecurringTransactionsRepository` em
      `src/modules/recurring-transactions/repositories/prisma/prisma-recurring-transactions-repository.ts`
      (depende de T005, T006)
- [X] T008 [P] Criar a função `recurringTransactionsRoutes(fastify)` vazia em
      `src/modules/recurring-transactions/infra/http/routes.ts` e registrá-la com o prefixo
      `/v1/recurring-transactions` em `src/infra/http/app.ts`, seguindo o mesmo padrão de
      `transactionsRoutes`
- [X] T009 [P] Criar um fake in-memory implementando `IRecurringTransactionsRepository` para
      os testes unitários em
      `tests/unit/modules/recurring-transactions/in-memory-recurring-transactions-repository.ts`
      (depende de T005)
- [X] T010 [P] Criar um fake in-memory implementando o `ITransactionsRepository` já existente
      para os testes unitários em
      `tests/unit/modules/transactions/in-memory-transactions-repository.ts` (necessário para
      os testes unitários de `ProcessRecurringTransactionsUseCase` na US3)
- [X] T011 [P] Criar o helper de setup de testes e2e em `tests/e2e/setup.ts`, que constrói o
      `app` do Fastify, aponta o Prisma para `DATABASE_URL_TEST`, e limpa as tabelas relevantes
      entre os testes (research.md, Decisão 4)

**Checkpoint**: Fundação pronta — a implementação das user stories pode começar.

---

## Fase 3: User Story 1 - Cadastrar uma recorrência (Prioridade: P1) 🎯 MVP parte 1

**Objetivo**: Um usuário autenticado consegue cadastrar uma recorrência (descrição, valor,
tipo, frequência, data de início, data de término opcional, categoria).

**Teste Independente**: `POST /v1/recurring-transactions` com um corpo válido retorna `201` e
a recorrência passa a existir associada ao usuário autenticado (verificável via o repository
Prisma diretamente, sem depender do endpoint `GET` da User Story 2).

### Testes da User Story 1 (OBRIGATÓRIO pelo Princípio X da constitution) ⚠️

> Escreva estes testes primeiro; eles devem falhar antes da implementação abaixo.

- [X] T012 [P] [US1] Teste unitário de `CreateRecurringTransactionUseCase` (caminho feliz;
      categoria inexistente lança `CategoryNotFoundError`) em
      `tests/unit/modules/recurring-transactions/use-cases/create-recurring-transaction.spec.ts`,
      usando os fakes de T009/T010
- [X] T013 [P] [US1] Teste e2e de `POST /v1/recurring-transactions` (201 no caminho feliz, 400
      de validação Zod, 401 sem autenticação) em
      `tests/e2e/modules/recurring-transactions/create-recurring-transaction.e2e.spec.ts`

### Implementação da User Story 1

- [X] T014 [P] [US1] Criar `CategoryNotFoundError` (estende `AppError`, status 404) em
      `src/modules/recurring-transactions/use-cases/errors/category-not-found-error.ts`
- [X] T015 [P] [US1] Criar o DTO Zod `createRecurringTransactionSchema` (description, amount >
      0, type, frequency, startDate, endDate opcional, categoryId) em
      `src/modules/recurring-transactions/dtos/create-recurring-transaction.dto.ts`, conforme
      `contracts/recurring-transactions.http.md`
- [X] T016 [US1] Implementar `CreateRecurringTransactionUseCase` em
      `src/modules/recurring-transactions/use-cases/create-recurring-transaction.ts`: valida
      que a categoria existe (via `ICategoriesRepository.findById`, lança
      `CategoryNotFoundError` se não existir), depois delega a criação ao
      `IRecurringTransactionsRepository` (depende de T005, T014)
- [X] T017 [US1] Implementar `CreateRecurringTransactionController` em
      `src/modules/recurring-transactions/infra/http/controllers/create-recurring-transaction.controller.ts`:
      valida o body com o schema de T015, extrai `userId` de `request.user.sub`, instancia
      manualmente `PrismaRecurringTransactionsRepository` + `PrismaCategoriesRepository` +
      `CreateRecurringTransactionUseCase`, retorna `201` (depende de T015, T016)
- [X] T018 [US1] Adicionar a rota `POST /` ligada ao `CreateRecurringTransactionController` com
      `fastify.authenticate` em `src/modules/recurring-transactions/infra/http/routes.ts`
      (depende de T008, T017)

**Checkpoint**: User Story 1 completa e testável de forma independente.

---

## Fase 4: User Story 2 - Consultar, editar e remover recorrências (Prioridade: P1) 🎯 MVP parte 2

**Objetivo**: Um usuário autenticado consegue listar, ver detalhes, editar e remover somente
as recorrências que pertencem a ele; recorrências de outros usuários retornam 404.

**Teste Independente**: Criar recorrências (via repository/seed direto, sem depender do
endpoint `POST` da User Story 1), depois listar, editar e remover via os endpoints desta
história, verificando o isolamento entre usuários.

### Testes da User Story 2 (OBRIGATÓRIO pelo Princípio X da constitution) ⚠️

- [X] T019 [P] [US2] Teste unitário de `FetchRecurringTransactionsUseCase` (lista apenas as do
      usuário) em
      `tests/unit/modules/recurring-transactions/use-cases/fetch-recurring-transactions.spec.ts`
- [X] T020 [P] [US2] Teste unitário de `FetchRecurringTransactionUseCase` (caminho feliz; lança
      `ResourceNotFoundError` para recorrência inexistente ou de outro usuário) em
      `tests/unit/modules/recurring-transactions/use-cases/fetch-recurring-transaction.spec.ts`
- [X] T021 [P] [US2] Teste unitário de `UpdateRecurringTransactionUseCase` (caminho feliz;
      not-found cross-user; categoria inexistente; `endDate` anterior a `startDate`) em
      `tests/unit/modules/recurring-transactions/use-cases/update-recurring-transaction.spec.ts`
- [X] T022 [P] [US2] Teste unitário de `DeleteRecurringTransactionUseCase` (caminho feliz;
      not-found cross-user) em
      `tests/unit/modules/recurring-transactions/use-cases/delete-recurring-transaction.spec.ts`
- [X] T023 [P] [US2] Teste e2e de `GET /v1/recurring-transactions` e
      `GET /v1/recurring-transactions/:id` (200 caminho feliz, 404 cross-user, 401 sem
      autenticação) em
      `tests/e2e/modules/recurring-transactions/fetch-recurring-transactions.e2e.spec.ts`
- [X] T024 [P] [US2] Teste e2e de `PUT /v1/recurring-transactions/:id` (200 caminho feliz, 400
      de validação, 404 cross-user) em
      `tests/e2e/modules/recurring-transactions/update-recurring-transaction.e2e.spec.ts`
- [X] T025 [P] [US2] Teste e2e de `DELETE /v1/recurring-transactions/:id` (200 caminho feliz,
      404 cross-user) em
      `tests/e2e/modules/recurring-transactions/delete-recurring-transaction.e2e.spec.ts`

### Implementação da User Story 2

- [X] T026 [P] [US2] Criar o DTO Zod `updateRecurringTransactionSchema` (todos os campos
      opcionais) em
      `src/modules/recurring-transactions/dtos/update-recurring-transaction.dto.ts`
- [X] T027 [US2] Implementar `FetchRecurringTransactionsUseCase` (lista por `userId`) em
      `src/modules/recurring-transactions/use-cases/fetch-recurring-transactions.ts` (depende
      de T005)
- [X] T028 [US2] Implementar `FetchRecurringTransactionUseCase` (`findByIdAndUser`, lança
      `ResourceNotFoundError`) em
      `src/modules/recurring-transactions/use-cases/fetch-recurring-transaction.ts` (depende
      de T005)
- [X] T029 [US2] Implementar `UpdateRecurringTransactionUseCase` (`findByIdAndUser`; valida a
      categoria se informada; valida `endDate` > `startDate`; delega o update ao repository)
      em `src/modules/recurring-transactions/use-cases/update-recurring-transaction.ts`
      (depende de T005, T014, T026)
- [X] T030 [US2] Implementar `DeleteRecurringTransactionUseCase` (`findByIdAndUser`, delega a
      remoção ao repository) em
      `src/modules/recurring-transactions/use-cases/delete-recurring-transaction.ts` (depende
      de T005)
- [X] T031 [P] [US2] Implementar `FetchRecurringTransactionsController` em
      `src/modules/recurring-transactions/infra/http/controllers/fetch-recurring-transactions.controller.ts`
      (depende de T027)
- [X] T032 [P] [US2] Implementar `FetchRecurringTransactionController` em
      `src/modules/recurring-transactions/infra/http/controllers/fetch-recurring-transaction.controller.ts`
      (depende de T028)
- [X] T033 [P] [US2] Implementar `UpdateRecurringTransactionController` em
      `src/modules/recurring-transactions/infra/http/controllers/update-recurring-transaction.controller.ts`
      (depende de T026, T029)
- [X] T034 [P] [US2] Implementar `DeleteRecurringTransactionController` em
      `src/modules/recurring-transactions/infra/http/controllers/delete-recurring-transaction.controller.ts`
      (depende de T030)
- [X] T035 [US2] Adicionar as rotas `GET /`, `GET /:id`, `PUT /:id`, `DELETE /:id` ligadas aos
      controllers de T031-T034, cada uma com `fastify.authenticate`, em
      `src/modules/recurring-transactions/infra/http/routes.ts` (depende de T018, T031-T034)

**Checkpoint**: User Stories 1 e 2 completas — CRUD de recorrências funcional de ponta a
ponta (MVP do gerenciamento manual).

---

## Fase 5: User Story 3 - Geração automática das transações devidas (Prioridade: P2)

**Objetivo**: Um processo autônomo, disparado por um job externo, identifica recorrências
vencidas e gera as transações reais correspondentes, sem duplicidade e com backfill completo
de ciclos perdidos.

**Teste Independente**: Rodar `ProcessRecurringTransactionsUseCase` diretamente (via teste
unitário com fakes) contra um conjunto de recorrências com diferentes datas de início,
término e última geração, e verificar que exatamente os ciclos devidos geram transação, uma
única vez cada.

### Testes da User Story 3 (OBRIGATÓRIO pelo Princípio X da constitution) ⚠️

- [X] T036 [P] [US3] Teste unitário de `ProcessRecurringTransactionsUseCase` em
      `tests/unit/modules/recurring-transactions/use-cases/process-recurring-transactions.spec.ts`,
      cobrindo: ciclo vencido gera transação datada da competência e atualiza
      `lastGeneratedDate`; ciclo ainda não vencido não gera nada; recorrência já processada
      não duplica ao rodar de novo; recorrência com `endDate` passado não gera; recorrência
      com `startDate` futuro não gera; múltiplos ciclos perdidos geram uma transação por
      ciclo, cada uma com sua própria data de competência (FR-014); frequência mensal em
      final de mês respeita a normalização em UTC (research.md, Decisão 2, revisada durante a
      implementação) — usando os fakes de T009/T010

### Implementação da User Story 3

- [X] T037 [US3] Adicionar `findManyDue(referenceDate: Date)` a
      `IRecurringTransactionsRepository` (recorrências com `startDate <= referenceDate`,
      sem filtrar por `endDate` nesta query — uma recorrência encerrada pode ter ciclos
      pendentes de backfill; quem decide se há algo a gerar é `calculateDueCycles`) e
      implementá-lo em `PrismaRecurringTransactionsRepository`; adicionar o método
      correspondente no fake
      in-memory de T009 — arquivos:
      `src/modules/recurring-transactions/repositories/irecurring-transactions-repository.ts`,
      `src/modules/recurring-transactions/repositories/prisma/prisma-recurring-transactions-repository.ts`,
      `tests/unit/modules/recurring-transactions/in-memory-recurring-transactions-repository.ts`
      (depende de T005, T007, T009)
- [X] T038 [US3] Implementar o helper puro de cálculo de ciclos `calculateDueCycles(startDate,
      lastGeneratedDate, endDate, frequency, referenceDate)` (retorna a lista ordenada de
      datas de ciclo vencidas e não processadas, usando aritmética de datas em UTC nativa —
      `Date.UTC`/`getUTC*`, não `date-fns`, por causa do bug de timezone descoberto e
      documentado em research.md Decisão 2) em
      `src/modules/recurring-transactions/use-cases/calculate-due-cycles.ts`, conforme
      research.md Decisão 1
- [X] T039 [US3] Implementar `ProcessRecurringTransactionsUseCase` em
      `src/modules/recurring-transactions/use-cases/process-recurring-transactions.ts`: busca
      recorrências devidas via `findManyDue`, calcula os ciclos pendentes de cada uma via
      `calculateDueCycles`, cria uma `Transaction` por ciclo (via `ITransactionsRepository`)
      com a data de competência do ciclo, e atualiza `lastGeneratedDate` para a data do último
      ciclo gerado (depende de T037, T038)
- [X] T040 [US3] Criar o entrypoint do job em
      `src/infra/jobs/process-recurring-transactions.job.ts`: instancia manualmente
      `PrismaRecurringTransactionsRepository`, `PrismaTransactionsRepository` e
      `ProcessRecurringTransactionsUseCase`, executa `.execute()` uma vez, loga quantas
      transações foram geradas, e encerra o processo (depende de T039; consumido pelo script
      `jobs:process-recurring-transactions` adicionado em T001)

**Checkpoint**: Feature completa — CRUD + geração automática funcionando de ponta a ponta.

---

## Fase 6: Polimento & Preocupações Transversais

**Propósito**: Validação final e revisão de conformidade.

- [X] T041 [P] Rodar os quatro cenários de `quickstart.md` de ponta a ponta contra o banco de
      desenvolvimento local, para validar a feature completa manualmente
- [X] T042 Revisar todos os arquivos novos em relação aos Princípios I, IV, V, VI e VIII da
      constitution (imports relativos; nenhum use case/controller/entidade importa o Prisma
      Client diretamente; controllers instanciam repository/use case manualmente sem
      container de DI; nenhum try/catch de erro de negócio em controller)
- [X] T043 Adicionar rastreabilidade entre `Transaction` e `RecurringTransaction`: campo
      `recurringTransactionId` (opcional) e relação `recurringTransaction` em `Transaction`
      com `onDelete: SetNull`, mais a relação inversa `transactions Transaction[]` em
      `RecurringTransaction`, em `prisma/schema.prisma`; propagar o campo na entidade
      `Transaction` (`src/modules/transactions/entities/transaction.ts`), em
      `TransactionCreateData` (`src/modules/transactions/repositories/itransactions-repository.ts`)
      e no fake in-memory (`tests/unit/modules/transactions/in-memory-transactions-repository.ts`);
      preencher `recurringTransactionId` ao gerar a transação em
      `ProcessRecurringTransactionsUseCase`. Pedido explícito do usuário após a implementação
      inicial, para não perder a rastreabilidade de qual recorrência originou qual transação
      (complementa data-model.md)

---

## Dependências & Ordem de Execução

### Dependências entre Fases

- **Setup (Fase 1)**: sem dependências — pode começar imediatamente
- **Foundational (Fase 2)**: depende da conclusão do Setup — BLOQUEIA todas as user stories
- **User Story 1 (Fase 3)**: depende apenas do Foundational
- **User Story 2 (Fase 4)**: depende do Foundational; T035 depende de T018 (US1) porque
  ambas escrevem em `routes.ts`, mas os use cases/controllers de US2 (T026-T034) podem ser
  desenvolvidos em paralelo à User Story 1
- **User Story 3 (Fase 5)**: depende apenas do Foundational (T005, T007, T009, T010) — não
  depende de US1 nem US2, pode ser implementada em paralelo a ambas
- **Polimento (Fase 6)**: depende de todas as user stories desejadas estarem completas

### Dentro de Cada User Story

- Testes MUST ser escritos e falhar antes da implementação correspondente
- DTOs/erros antes dos use cases; use cases antes dos controllers; controllers antes das
  routes
- História completa e validada antes de mover para a próxima prioridade

### Oportunidades de Paralelismo

- Todas as tasks [P] da Fase 1 podem rodar em paralelo (arquivos diferentes)
- Na Fase 2, T005/T006/T008/T009/T010/T011 podem rodar em paralelo; T007 depende de T005+T006
- Uma vez concluído o Foundational, User Story 1, User Story 2 (exceto T035) e User Story 3
  inteira podem ser desenvolvidas em paralelo por pessoas diferentes
- Dentro de cada história, todos os testes marcados [P] podem rodar em paralelo entre si, e
  todos os controllers marcados [P] (US2) podem ser implementados em paralelo entre si

---

## Exemplo de Paralelismo: User Story 2

```bash
# Testes da User Story 2 em paralelo:
Task: "Teste unitário de FetchRecurringTransactionsUseCase em tests/unit/.../fetch-recurring-transactions.spec.ts"
Task: "Teste unitário de FetchRecurringTransactionUseCase em tests/unit/.../fetch-recurring-transaction.spec.ts"
Task: "Teste unitário de UpdateRecurringTransactionUseCase em tests/unit/.../update-recurring-transaction.spec.ts"
Task: "Teste unitário de DeleteRecurringTransactionUseCase em tests/unit/.../delete-recurring-transaction.spec.ts"

# Controllers da User Story 2 em paralelo (depois dos use cases prontos):
Task: "Implementar FetchRecurringTransactionsController em .../controllers/fetch-recurring-transactions.controller.ts"
Task: "Implementar FetchRecurringTransactionController em .../controllers/fetch-recurring-transaction.controller.ts"
Task: "Implementar UpdateRecurringTransactionController em .../controllers/update-recurring-transaction.controller.ts"
Task: "Implementar DeleteRecurringTransactionController em .../controllers/delete-recurring-transaction.controller.ts"
```

---

## Estratégia de Implementação

### MVP Primeiro (User Stories 1 + 2)

1. Completar Fase 1: Setup
2. Completar Fase 2: Foundational (bloqueia todas as histórias)
3. Completar Fase 3: User Story 1 (criação)
4. Completar Fase 4: User Story 2 (consulta/edição/remoção)
5. **PARAR e VALIDAR**: rodar os Cenários 1 e 2 de `quickstart.md` — CRUD completo já entrega
   valor (usuário gerencia recorrências manualmente) mesmo sem a geração automática
6. Deploy/demo se pronto

### Entrega Incremental

1. Setup + Foundational → base pronta
2. User Story 1 → testar isoladamente → cadastro funcionando
3. User Story 2 → testar isoladamente → CRUD completo (MVP de gerenciamento)
4. User Story 3 → testar isoladamente (unitário, sem rota) → geração automática funcionando
5. Cada história agrega valor sem quebrar as anteriores

### Estratégia com Time em Paralelo

Com mais de uma pessoa disponível:

1. Time completa Setup + Foundational junto
2. Depois do Foundational:
   - Pessoa A: User Story 1
   - Pessoa B: User Story 3 (independente de US1/US2)
   - Pessoa C: entra em User Story 2 assim que US1 estiver perto de concluir T018 (por causa
     do compartilhamento de `routes.ts` em T035)

---

## Notas

- [P] = arquivos diferentes, sem dependência de uma task ainda incompleta
- [Story] mapeia a task para a user story correspondente, para rastreabilidade
- Nenhuma rota HTTP é exposta para `ProcessRecurringTransactionsUseCase` — é chamado apenas
  pelo entrypoint de job (T040), por isso a User Story 3 não tem testes e2e, só unitários
- Verifique que os testes falham antes de implementar
- Faça commit após cada task ou grupo lógico de tasks
- Pare em qualquer checkpoint para validar a história isoladamente
