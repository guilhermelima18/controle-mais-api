# Research: Recorrências (Recurring Transactions)

## Decisão 1: Como a próxima ocorrência é calculada e como o backfill de ciclos perdidos é feito

**Decision**: Cada recorrência guarda `startDate` e `lastGeneratedDate` (nulo até a primeira
geração). No processamento:

1. O "cursor" de cada recorrência é `lastGeneratedDate ?? startDate` — ou seja, se nunca gerou,
   o primeiro ciclo devido é o próprio `startDate`.
2. A partir do cursor, calcula-se repetidamente a próxima data de ciclo somando o intervalo da
   `frequency` (dia/semana/mês/ano, via `date-fns`: `addDays`/`addWeeks`/`addMonths`/`addYears`),
   gerando uma transação para **cada** data de ciclo `<= hoje` (e `<= endDate`, se definido),
   em ordem cronológica, até não haver mais ciclos vencidos.
3. Após gerar todas as transações pendentes de uma recorrência, `lastGeneratedDate` é
   atualizado para a data do último ciclo gerado (não para "hoje"), garantindo que a próxima
   execução recomece exatamente do ciclo seguinte.
4. O primeiro ciclo (quando `lastGeneratedDate` é nulo) é o próprio `startDate`, não
   `startDate + 1 intervalo` — ou seja, uma recorrência começa a gerar já na sua data de
   início, não a partir do ciclo seguinte.

**Rationale**: Implementa diretamente a decisão já tomada no spec (FR-014, backfill completo)
e a decisão de data de competência (FR-009): cada transação gerada carrega a data do ciclo a
que corresponde, não a data em que o job rodou. Guardar o cursor como a última data de ciclo
processada (não como timestamp de execução do job) é o que torna o processo idempotente e
correto mesmo com execuções atrasadas ou repetidas.

**Alternatives considered**:
- Guardar apenas "quantos ciclos já foram gerados" (contador) em vez de uma data — rejeitado
  por ser menos auditável e mais difícil de raciocinar em caso de edição de `frequency` no
  meio do caminho.
- Gerar só o ciclo mais recente e descartar os demais — rejeitado explicitamente pelo usuário
  na clarificação do spec (FR-014 exige backfill completo).

## Decisão 2: Regra para mês mais curto (frequência mensal/anual em dias como 29/30/31)

**Decision**: **Revisada durante a implementação.** A escolha original era usar `date-fns`
`addMonths`/`addYears`. Ao implementar `calculate-due-cycles.ts`, descobrimos que `date-fns`
opera sobre os componentes de calendário **locais** do objeto `Date` (o mesmo timezone do
processo Node em execução), não sobre UTC. Como todo o resto do sistema trata datas como
instantes UTC (Prisma `DateTime`, strings ISO com `Z`), isso significa que o resultado de
`addMonths` mudaria dependendo do timezone do servidor onde o job roda — um bug real de
correção financeira, não só um detalhe de teste (confirmado empiricamente: em timezone
`America/Sao_Paulo`, `addMonths("2026-01-31T00:00:00.000Z", 1)` retornava
`2026-03-01T00:00:00.000Z`, não `2026-02-28T00:00:00.000Z`).

A decisão final é **não usar `date-fns`** para esse cálculo específico, e sim uma função
utilitária própria (`addUTCMonths`/`addUTCDays` em `calculate-due-cycles.ts`) que opera
exclusivamente sobre os componentes `getUTC*`/`Date.UTC(...)`, com clamping manual para o
último dia do mês de destino. Isso continua sem adicionar nenhuma dependência nova (é JS
nativo), na verdade removendo uma dependência do caminho crítico dessa conta.

**Rationale**: Comportamento previsível e determinístico independente do timezone do servidor
onde o processo roda (dev local vs. produção) — essencial para um cálculo que afeta a data de
transações financeiras reais. Documentado porque é um Edge Case citado no spec, e porque a
descoberta do bug de timezone só aconteceu ao escrever o teste unitário de
`calculateDueCycles` (T036), com asserções de data literal em UTC.

**Alternatives considered**:
- Manter `date-fns` `addMonths`/`addYears` — rejeitado após a descoberta do bug de timezone
  acima.
- Adicionar `date-fns-tz` (ou similar) só para operar em UTC — rejeitado por introduzir uma
  dependência nova para resolver algo que `Date.UTC`/`getUTC*` nativos já resolvem em poucas
  linhas (Princípio IX — YAGNI).
- Implementar a regra de "clamping" manualmente — mantido, mas agora operando em UTC nativo em
  vez de delegar a uma biblioteca que assume timezone local.

## Decisão 3: Mecanismo de disparo do processamento automático (worker/cron)

**Decision**: Um script de entrypoint simples, `src/infra/jobs/process-recurring-transactions.job.ts`,
que instancia `PrismaRecurringTransactionsRepository`, `PrismaTransactionsRepository` e
`ProcessRecurringTransactionsUseCase` manualmente (Princípio VI), executa `.execute()` uma vez
e encerra o processo. Um script no `package.json`
(`"jobs:process-recurring-transactions": "tsx src/infra/jobs/process-recurring-transactions.job.ts"`,
equivalente compilado `node dist/infra/jobs/process-recurring-transactions.job.js`) expõe esse
entrypoint para ser chamado por um agendador externo (cron do SO em dev, ou o recurso de
"Cron Job" do provedor de deploy em produção).

**Rationale**: Não há nenhuma infraestrutura de fila/scheduler no projeto hoje. Adicionar uma
biblioteca de agendamento in-process (`node-cron`, `bullmq`, etc.) exigiria manter um processo
de longa duração adicional só para este job, além de lidar com múltiplas réplicas rodando o
mesmo agendador simultaneamente — complexidade não demonstrada como necessária (Princípio IX).
Um script standalone disparado por um agendador externo mantém o processamento tão simples
quanto o problema exige, e o próprio use case já garante idempotência (Decisão 1), então rodar
o script mais de uma vez por engano não duplica dados.

**Alternatives considered**:
- Endpoint HTTP protegido por segredo, chamado por um scheduler externo via HTTP — rejeitado
  por exigir expor uma rota adicional e gerenciar um segredo de autenticação só para esse
  propósito, sem ganho sobre um script chamado diretamente pelo agendador do ambiente de
  deploy.
- Biblioteca de agendamento in-process (`node-cron`) rodando dentro do próprio processo
  Fastify — rejeitado por acoplar o ciclo de vida do job ao do servidor HTTP e por risco de
  execução duplicada em ambientes com múltiplas réplicas do servidor.

## Decisão 4: Vitest e banco de teste (setup necessário, ainda não existente no projeto)

**Decision**: Adicionar `vitest` e `@vitest/coverage-v8` como dependências de desenvolvimento,
com `vitest.config.ts` mínimo e script `"test": "vitest run"` no `package.json`. Para os testes
e2e (Princípio X), reutilizar o `docker-compose.yml` existente adicionando uma segunda
`database` de teste no mesmo container Postgres (mesma instância, `DATABASE_URL` de teste
apontando para um banco `controle-mais-db-test` separado), migrada via Prisma antes da suíte
rodar. Testes unitários usam uma implementação in-memory de
`IRecurringTransactionsRepository` (e reaproveitam/estendem a fake de `ITransactionsRepository`
se já existir; caso não exista, criar uma fake mínima), nunca o Prisma real.

**Rationale**: O Princípio X é NON-NEGOTIABLE e ainda não tinha nenhum teste implementado no
projeto; esta é a primeira feature construída sob essa regra, então o setup mínimo de Vitest e
do banco de teste é pré-requisito, não opcional. Reaproveitar o container Postgres já existente
(um banco a mais, não um serviço novo) é a opção mais simples que ainada cumpre o isolamento
exigido (não rodar teste e2e contra o banco de desenvolvimento).

**Alternatives considered**:
- Subir um container Postgres totalmente separado só para teste — rejeitado por duplicar
  infraestrutura sem necessidade; um banco adicional no mesmo container já garante isolamento
  de dados.
- Mockar o Prisma diretamente nos testes e2e — rejeitado explicitamente pelo Princípio X
  (MUST NOT mockar Prisma nem em teste unitário, e e2e exige banco real).

## Decisão 5: Escopo de `categoryId` (correção em relação ao spec inicial)

**Decision**: `Category` é uma entidade global do sistema (sem coluna `userId` no schema atual
— compartilhada por todos os usuários), não um recurso por usuário. A validação de
`categoryId` em `RecurringTransaction` verifica apenas que a categoria existe, sem checagem de
posse. O spec (`FR-002`) já foi ajustado para refletir isso.

**Rationale**: Levantado durante a pesquisa técnica ao inspecionar `prisma/schema.prisma` e o
módulo `categories` existente; escrever a regra original ("categoria pertence ao usuário")
exigiria adicionar ownership a `Category`, uma mudança de escopo não pedida nesta feature.

**Alternatives considered**: Adicionar `userId` a `Category` nesta mesma feature — rejeitado
por expandir o escopo da feature de recorrências para o domínio de categorias, sem pedido
explícito do usuário.
