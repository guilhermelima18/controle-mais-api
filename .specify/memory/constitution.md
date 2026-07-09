<!--
SYNC IMPACT REPORT
Version change: [TEMPLATE] → 1.0.0 (ratificação inicial)
Modified principles: n/a (primeira versão preenchida)
Added principles:
  I. Arquitetura por Domínio (NON-NEGOTIABLE)
  II. Entidades Sem Vazamento de Forma Interna
  III. Identidade Sempre a partir do Token Autenticado
  IV. Erros de Domínio Tipados
  V. Repository é a Única Porta de Dados
  VI. Injeção de Dependência Manual
  VII. Formato de Módulo do Prisma Fixado Explicitamente
  VIII. Imports Relativos
  IX. Simplicidade (YAGNI)
  X. Testes Automatizados Obrigatórios (NON-NEGOTIABLE)
Added sections:
  Stack e Restrições Técnicas
  Fluxo de Desenvolvimento e Portões de Qualidade
  Governance
Removed sections: nenhuma (placeholders do template substituídos)
Templates requiring updates:
  ✅ .specify/templates/plan-template.md — "Constitution Check" já é dinâmico (lê este arquivo), nenhuma mudança estrutural necessária
  ✅ .specify/templates/spec-template.md — não referencia princípios fixos, nenhuma mudança necessária
  ⚠ .specify/templates/tasks-template.md — linha "Tests are OPTIONAL" conflita com o Princípio X (testes obrigatórios); atualizada nesta mesma mudança para refletir que testes são MANDATÓRIOS neste projeto
  ✅ .claude/skills/speckit-constitution/SKILL.md — nenhuma referência desatualizada
Follow-up TODOs: nenhum
-->

# Controle+ API Constitution

## Core Principles

### I. Arquitetura por Domínio (NON-NEGOTIABLE)

Toda feature nova ou alterada DEVE seguir a estrutura de módulos já implementada em
`src/modules/<domínio>/`:

```
src/modules/<domínio>/
├── dtos/            # schemas Zod por ação (+ z.infer exportado)
├── entities/        # classes com props privadas + getters + toJSON()
├── repositories/
│   ├── i<entidade>-repository.ts               # interface (porta)
│   └── prisma/prisma-<entidade>-repository.ts  # implementação
├── use-cases/
│   ├── errors/       # erros de domínio específicos do módulo (extends AppError)
│   └── <ação>-<entidade>.ts  # 1 classe por arquivo, repository injetado via construtor
└── infra/http/
    ├── controllers/  # só validam (Zod) e delegam ao use case
    └── routes.ts     # todas as rotas do módulo, registradas com prefixo em infra/http/app.ts
```

Infraestrutura compartilhada vive fora de `modules/`: `src/@types/` (tipagens globais),
`src/config/` (leitura de env), `src/core/errors/` (erros base reutilizáveis entre domínios),
`src/infra/` (banco, HTTP, middlewares globais).

MUST NOT existir lógica de negócio em `controllers/` ou `routes.ts` — controllers só validam
payload e delegam ao use case; routes só registram método HTTP + path + middleware.
MUST NOT criar uma nova camada técnica cross-domínio (ex: um `services/` genérico) fora
desse padrão sem amendment explícito desta constitution.

**Racional**: o projeto já foi migrado uma vez de uma arquitetura em camadas técnicas
(`controllers/routes/services`) para esta estrutura por domínio; regressão para o padrão
antigo, ainda que parcial, invalida o motivo da migração.

### II. Entidades Sem Vazamento de Forma Interna

Toda entidade (`entities/*.ts`) que pode aparecer, direta ou indiretamente, em uma resposta
HTTP DEVE implementar `toJSON()` retornando os campos planos do domínio — nunca a forma
interna (`props`) usada para encapsulamento.

**Racional**: já houve um bug real em produção onde o Fastify serializou
`{"props": {...}}` em vez dos campos reais, porque a entidade guardava seus dados num campo
privado `props` sem `toJSON()`, quebrando os endpoints `GET /categories`, `GET /categories/:id`,
`GET /transactions/:id` e a listagem com filtros de transações.

**Como aplicar**: ao criar uma entidade nova, `toJSON()` é obrigatório e faz parte da
definição mínima da classe, não um extra a ser lembrado depois.

### III. Identidade Sempre a partir do Token Autenticado

`userId`/ownership de um recurso MUST NOT ser lido de `request.body` ou de qualquer dado
fornecido pelo cliente. A identidade do usuário autenticado vem exclusivamente de
`request.user.sub` (claim `sub` do JWT).

Toda operação de update/delete sobre um recurso pertencente a um usuário MUST buscar esse
recurso através de um método de repository escopado pelo dono (padrão `findByIdAndUser`,
não `findById` seguido de checagem em memória) e retornar 404 — nunca 403 — quando o recurso
não existe ou não pertence ao solicitante, para não vazar a existência do recurso a um
usuário não autorizado.

**Racional**: já existiu um bug real de autorização onde `userId` era aceito do corpo da
requisição em `create`/`update` de transação, e `delete` não checava o dono da transação —
um usuário conseguia ler, editar ou apagar transações de outro usuário autenticado.

### IV. Erros de Domínio Tipados

Use cases MUST lançar subclasses de `AppError` (`core/errors/app-error.ts`, que carrega
`statusCode`) em vez de `Error` genérico ou retorno silencioso de `null`/`undefined` em
caminhos de erro. Erros reutilizáveis entre módulos (ex: `ResourceNotFoundError`) vivem em
`core/errors/`; erros específicos de um domínio (ex: `UserAlreadyExistsError`,
`InvalidCredentialsError`) vivem em `modules/<domínio>/use-cases/errors/`.

Controllers MUST NOT fazer `try/catch` de erro de negócio nem comparar
`error.message === "..."` para decidir o status HTTP. Erros de domínio propagam para o
error handler global (`infra/http/app.ts`), que verifica `instanceof AppError` antes de
qualquer outro fallback. Controllers só tratam localmente erros de validação de payload
(Zod, HTTP 400).

**Racional**: comparação de string de erro é frágil e acopla o controller ao texto exato da
mensagem; um error handler central com erros tipados é a forma testável de garantir o
contrato de status HTTP.

### V. Repository é a Única Porta de Dados

Nenhum use case, controller ou entidade MUST importar o Prisma Client diretamente. O único
ponto de acesso ao banco é a implementação em `repositories/prisma/prisma-<entidade>-repository.ts`,
que implementa a interface `i<entidade>-repository.ts` do mesmo módulo.

**Racional**: a interface do repository é o contrato que os use cases dependem; trocar a
implementação (ex: para testes, ou para outro banco) não deve exigir alterar use case, dto
ou controller.

### VI. Injeção de Dependência Manual

Controllers instanciam repository e use case diretamente (`new PrismaXRepository()`,
`new XUseCase(repository)`), sem container de DI. MUST NOT introduzir um container de
injeção de dependência (ex: tsyringe, inversify) sem necessidade concreta demonstrada —
o custo de indireção não se paga em um projeto deste porte.

### VII. Formato de Módulo do Prisma Fixado Explicitamente

O generator do Prisma em `prisma/schema.prisma` MUST manter `moduleFormat = "cjs"`
explícito. Esse valor não pode ser removido nem deixado para inferência automática a partir
do `tsconfig.json`.

**Racional**: o generator do Prisma infere ESM vs. CommonJS a partir do `module` do
`tsconfig.json` quando `moduleFormat` não é informado. Um mismatch entre essa inferência e o
runtime real (Node executando código CommonJS) já quebrou o deploy em produção no Render com
`ReferenceError: exports is not defined in ES module scope`, porque o Prisma gerou
`import.meta.url` num arquivo que o Node carregava via `require()`.

### VIII. Imports Relativos

Módulos MUST usar imports relativos (`../../infra/database/prisma`) em vez do alias
`@/` declarado em `tsconfig.json`. O alias existe no `paths` do tsconfig mas não há
resolução configurada em runtime (`tsx` no dev, build de produção) para ele.

**Como aplicar**: só adotar o alias `@/` se, na mesma mudança, for configurada a resolução
correspondente tanto para `tsx` (dev) quanto para o build de produção (`tsc`/bundler) — nunca
como uma mudança isolada de estilo.

### IX. Simplicidade (YAGNI)

MUST NOT introduzir abstração especulativa: feature flags, camadas "para escalabilidade
futura", generalizações sem um segundo caso de uso concreto hoje, ou configuração
condicional sem necessidade comprovada. Três linhas parecidas são preferíveis a uma
abstração prematura.

Qualquer desvio deste princípio (ex: uma camada extra, um padrão mais genérico que o
estritamente necessário) MUST ser justificado na seção "Complexity Tracking" do plano da
feature (`.specify/templates/plan-template.md`), explicando por que a alternativa mais
simples é insuficiente.

### X. Testes Automatizados Obrigatórios (NON-NEGOTIABLE)

- **Unitários**: todo use case novo ou alterado MUST ter teste unitário cobrindo o caminho
  feliz e cada erro de domínio que ele pode lançar, usando uma implementação fake/in-memory
  da interface de repository. MUST NOT mockar o Prisma diretamente nem bater em banco real
  em teste unitário.
- **End-to-end**: toda rota nova ou alterada MUST ter teste e2e batendo na aplicação Fastify
  real via `app.inject()` (sem precisar de porta de rede aberta), contra um banco de dados
  de teste real (Postgres via docker-compose, migrado via Prisma). Cada teste e2e MUST
  cobrir: status code e formato de resposta do caminho feliz, o contrato de erro (400 de
  validação Zod, 401 de autenticação, 404 de recurso, 500 genérico quando aplicável) e, para
  rotas que operam sobre recursos de um usuário, o cenário de autorização cruzada (usuário A
  não pode ler/editar/apagar recurso de usuário B — ver Princípio III).
- **Stack de teste**: Vitest como test runner, `app.inject()` do Fastify para e2e.
- **Portão de PR**: nenhum PR que adiciona ou altera um use case ou uma rota é aceitável sem
  o teste correspondente. Ausência de teste é bloqueio de merge, não uma observação de
  review.

**Racional**: o projeto não tinha nenhum teste automatizado até esta versão da constitution;
os dois bugs reais citados nos Princípios II e III só foram pegos por verificação manual
durante a implementação, e só não chegaram a produção porque houve essa verificação manual
naquele momento — o objetivo deste princípio é que a próxima regressão semelhante seja pega
por um teste, não por sorte.

## Stack e Restrições Técnicas

- **Runtime/Linguagem**: Node.js + TypeScript, `strict: true` no `tsconfig.json`.
- **Framework HTTP**: Fastify v5. `infra/http/app.ts` monta a instância (plugins, rotas,
  error handler); `infra/http/server.ts` é o único ponto que chama `.listen()`.
- **ORM**: Prisma 7 (generator `prisma-client`, output customizado em `src/generated/prisma`,
  `moduleFormat = "cjs"` — ver Princípio VII), adapter `@prisma/adapter-pg`, PostgreSQL.
- **Validação**: Zod, schemas em `dtos/` por módulo, nunca inline dentro do use case.
- **Autenticação**: `@fastify/jwt`, estratégia stateless, guard compartilhado em
  `infra/@shared/middlewares/`.
- **Config**: `config/env.ts` é a única leitura direta de `process.env` do projeto; nenhum
  outro arquivo MUST ler `process.env` diretamente.
- **Módulos**: `module`/`moduleResolution` do `tsconfig.json` MUST permanecer um par válido
  reconhecido pelo TypeScript atual (não usar valores deprecated sem o `ignoreDeprecations`
  correspondente); qualquer mudança nesse par MUST ser validada rodando o build E o server
  compilado (`node dist/...`) de ponta a ponta antes de considerar a mudança concluída — não
  basta `tsc --noEmit` passar, já que o bug do Princípio VII só aparece em runtime.
- **Testes**: Vitest — ver Princípio X.

## Fluxo de Desenvolvimento e Portões de Qualidade

- Mudança estrutural (nova entidade, novo módulo, novo padrão de repository/use case) MUST
  seguir exatamente o Princípio I; divergências passam pelo processo de emenda desta
  constitution antes de virar padrão do código.
- Todo PR que adiciona/altera use case ou rota MUST incluir os testes exigidos pelo
  Princípio X antes de ser considerado mergeable.
- Mudança em `prisma/schema.prisma` (generator ou datasource) ou em `tsconfig.json`
  (`module`/`moduleResolution`) MUST incluir verificação end-to-end do build de produção
  (`npm run build && node dist/infra/http/server.js` respondendo a pelo menos uma rota que
  toque o Prisma), não só o build de desenvolvimento (`tsx`).
- Qualquer violação de princípio que um PR precise introduzir temporariamente MUST estar
  documentada na tabela "Complexity Tracking" do plano da feature correspondente
  (`.specify/templates/plan-template.md`), com a alternativa mais simples rejeitada e o
  motivo.

## Governance

Esta constitution tem precedência sobre qualquer convenção de código não documentada aqui.
Em caso de conflito entre um PR e um princípio desta constitution, o PR MUST ser ajustado ou
a constitution MUST ser emendada primeiro — nunca as duas coisas ficam divergentes
silenciosamente.

**Processo de emenda**: qualquer mudança nesta constitution (adicionar, remover ou
redefinir um princípio) MUST ser aprovada explicitamente pelo usuário/mantenedor do projeto
antes de qualquer PR que dependa dessa mudança ser aberto. Não é permitido a um agente ou
colaborador alterar a constitution e já assumir a mudança como vigente no mesmo PR de
implementação — a emenda é um passo separado e anterior.

**Versionamento semântico**:
- MAJOR: remoção ou redefinição incompatível de um princípio existente.
- MINOR: novo princípio ou seção adicionada, ou expansão material de uma regra existente.
- PATCH: esclarecimento, correção de texto, ajuste não semântico.

**Revisão de conformidade**: toda revisão de PR MUST verificar aderência aos princípios
desta constitution antes de aprovar; complexidade não justificada (Princípio IX) é motivo de
bloqueio, não de comentário opcional.

**Version**: 1.0.0 | **Ratified**: 2026-07-09 | **Last Amended**: 2026-07-09
