# Feature Specification: Recorrências (Recurring Transactions)

**Feature Branch**: `001-recurring-transactions`

**Created**: 2026-07-09

**Status**: Draft

**Input**: User description: "Módulo de recorrências (recurring-transactions) para gerenciar receitas/despesas que se repetem (ex: assinaturas, aluguel). Duas frentes: (1) CRUD de gerenciamento de recorrências pelo usuário; (2) processo autônomo, disparado por um worker/cron, que identifica recorrências devidas e gera as transações reais correspondentes, evitando duplicidade."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cadastrar uma recorrência (Priority: P1)

Como usuário do Controle+, quero cadastrar uma receita ou despesa que se repete
periodicamente (ex: assinatura de streaming, aluguel, salário) para não precisar lançar
manualmente a mesma transação todo mês/semana/ano.

**Why this priority**: Sem conseguir cadastrar uma recorrência, nenhuma das demais
funcionalidades do módulo tem propósito. É a base de todo o domínio.

**Independent Test**: Pode ser testado isoladamente criando uma recorrência com descrição,
valor, tipo (receita/despesa), frequência, data de início e categoria, e verificando que ela
passa a existir e pertence ao usuário autenticado.

**Acceptance Scenarios**:

1. **Given** um usuário autenticado com uma categoria própria já cadastrada, **When** ele
   cria uma recorrência informando descrição, valor, tipo, frequência, data de início e
   categoria, **Then** a recorrência é criada e associada a esse usuário.
2. **Given** um usuário autenticado, **When** ele tenta criar uma recorrência com valor
   negativo ou zero, tipo inválido, frequência não suportada, ou categoria que não é dele,
   **Then** o sistema rejeita a criação e informa o motivo.

---

### User Story 2 - Consultar, editar e remover recorrências (Priority: P1)

Como usuário, quero listar, ver detalhes, editar e remover minhas recorrências para manter
meu planejamento financeiro atualizado (ex: reajuste de aluguel, cancelamento de uma
assinatura).

**Why this priority**: Sem gerenciamento contínuo, uma recorrência cadastrada incorretamente
ou que deixou de existir na vida real continuaria gerando transações indevidamente. É tão
essencial quanto a criação para o MVP do módulo.

**Independent Test**: Pode ser testado isoladamente listando as recorrências de um usuário,
editando os campos de uma recorrência existente e removendo outra, verificando que as
mudanças refletem corretamente e que apenas recorrências do próprio usuário são afetadas.

**Acceptance Scenarios**:

1. **Given** um usuário com recorrências cadastradas, **When** ele lista suas recorrências,
   **Then** vê somente as que pertencem a ele.
2. **Given** uma recorrência existente do usuário, **When** ele atualiza valor, descrição,
   frequência, categoria ou data de término, **Then** as próximas gerações passam a
   considerar os novos dados.
3. **Given** uma recorrência existente do usuário, **When** ele a remove, **Then** ela deixa
   de gerar novas transações a partir dali.
4. **Given** uma recorrência que pertence a outro usuário, **When** o usuário autenticado
   tenta visualizar, editar ou remover essa recorrência pelo identificador, **Then** o
   sistema trata como se ela não existisse para esse usuário.

---

### User Story 3 - Geração automática das transações devidas (Priority: P2)

Como usuário, quero que minhas recorrências ativas gerem automaticamente a transação real
correspondente quando chegar a data de vencimento, sem que eu precise lançar nada
manualmente.

**Why this priority**: É o valor central do módulo (economizar lançamento manual), mas
depende logicamente de já existirem recorrências cadastradas (User Story 1) — por isso vem
em seguida na priorização, embora seja disparada por um processo autônomo e não por uma ação
direta do usuário na tela.

**Independent Test**: Pode ser testado isoladamente disparando o processo de geração contra
um conjunto de recorrências com diferentes datas de início, término e última geração, e
verificando que somente as recorrências devidas geram uma transação nova, exatamente uma vez
por ciclo.

**Acceptance Scenarios**:

1. **Given** uma recorrência ativa cuja próxima ocorrência já venceu, **When** o processo de
   geração é executado, **Then** uma transação real é criada com os dados da recorrência
   (descrição, valor, tipo, categoria), datada da competência do ciclo vencido, e a
   recorrência passa a refletir que aquele ciclo já foi processado.
2. **Given** uma recorrência cuja próxima ocorrência ainda não venceu, **When** o processo de
   geração é executado, **Then** nenhuma transação é criada para ela nesse momento.
3. **Given** uma recorrência já processada para o ciclo atual, **When** o processo de geração
   é executado novamente antes do próximo ciclo vencer (ex: reexecução do worker por falha
   ou reprocessamento), **Then** nenhuma transação duplicada é criada.
4. **Given** uma recorrência com data de término já passada, **When** o processo de geração é
   executado, **Then** nenhuma nova transação é criada para ela.
5. **Given** uma recorrência com data de início no futuro, **When** o processo de geração é
   executado antes dessa data, **Then** nenhuma transação é criada para ela ainda.
6. **Given** uma recorrência que acumulou múltiplos ciclos vencidos e não processados (ex: o
   processo automático ficou parado por alguns dias), **When** o processo de geração volta a
   rodar, **Then** uma transação é criada para cada ciclo vencido pendente, cada uma datada da
   competência do respectivo ciclo, sem duplicidade.

### Edge Cases

- O que acontece com uma recorrência mensal cuja data de início cai num dia que não existe em
  todos os meses (ex: dia 31)? O sistema deve ter uma regra consistente para o mês mais
  curto.
- Se o processo automático de geração ficar um período sem rodar (ex: worker fora do ar por
  alguns dias) e existirem múltiplos ciclos vencidos e ainda não gerados para a mesma
  recorrência, o sistema deve gerar uma transação para cada ciclo perdido (backfill
  completo), e não apenas uma transação representando o ciclo mais recente.
- A transação real gerada automaticamente deve usar a data em que o ciclo efetivamente venceu
  (data de competência), e não a data em que o processamento de fato ocorreu — isso garante
  que relatórios financeiros por período reflitam quando cada valor era devido.
- O que acontece quando um usuário remove a categoria usada por uma recorrência ativa?
- O que acontece se duas requisições de edição da mesma recorrência chegarem simultaneamente?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir que um usuário autenticado cadastre uma recorrência
  informando descrição, valor, tipo (receita ou despesa), frequência, data de início,
  data de término opcional e categoria.
- **FR-002**: O sistema MUST validar, na criação e na edição, que o valor é positivo, o tipo
  é um dos suportados, a frequência é uma das suportadas (diária, semanal, mensal, anual) e a
  categoria informada existe (categorias são compartilhadas entre todos os usuários, não têm
  dono individual).
- **FR-003**: O sistema MUST permitir que um usuário liste apenas as recorrências que
  pertencem a ele.
- **FR-004**: O sistema MUST permitir que um usuário veja os detalhes de uma recorrência
  específica, desde que ela pertença a ele.
- **FR-005**: O sistema MUST permitir que um usuário edite os dados de uma recorrência que
  pertence a ele.
- **FR-006**: O sistema MUST permitir que um usuário remova uma recorrência que pertence a
  ele, impedindo que ela gere novas transações a partir da remoção.
- **FR-007**: O sistema MUST garantir que um usuário não consiga visualizar, editar ou
  remover uma recorrência de outro usuário, tratando o recurso como inexistente para quem não
  é o dono, sem revelar que ele pertence a outra pessoa.
- **FR-008**: O sistema MUST identificar automaticamente, de forma independente de qualquer
  ação do usuário, quais recorrências ativas estão com um ciclo vencido e pendente de
  geração.
- **FR-009**: O sistema MUST gerar uma transação real correspondente a cada recorrência
  vencida, reaproveitando descrição, valor, tipo e categoria da recorrência, com a data da
  transação igual à data de competência do ciclo vencido (não a data do processamento).
- **FR-010**: O sistema MUST registrar, para cada recorrência, o momento do último ciclo
  processado, de forma que reexecuções do processo automático não gerem transações
  duplicadas para o mesmo ciclo.
- **FR-014**: Quando uma recorrência acumular múltiplos ciclos vencidos e não processados
  (ex: o processo automático ficou um período sem rodar), o sistema MUST gerar uma
  transação para cada ciclo vencido pendente (backfill completo), e não apenas uma
  transação representando o ciclo mais recente.
- **FR-011**: O sistema MUST parar de gerar novas transações para uma recorrência cuja data
  de término já tenha passado.
- **FR-012**: O sistema MUST parar de gerar transações para uma recorrência que já foi
  removida pelo usuário.
- **FR-013**: O processo de geração automática MUST poder ser executado sem que o usuário
  esteja com sessão ativa ou realize qualquer ação na aplicação.

### Key Entities *(include if feature involves data)*

- **Recorrência (Recurring Transaction)**: representa um padrão de receita ou despesa que se
  repete no tempo. Atributos principais: descrição, valor, tipo (receita/despesa),
  frequência (diária/semanal/mensal/anual), data de início, data de término (opcional),
  momento do último ciclo processado, usuário dono e categoria associada.
- **Transação (Transaction)**: registro financeiro real, já existente no sistema, gerado a
  partir de uma recorrência quando um ciclo vence.
- **Categoria (Category)**: classificação já existente no sistema, usada para agrupar tanto
  transações quanto recorrências.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um usuário consegue cadastrar uma nova recorrência em menos de 1 minuto.
- **SC-002**: 100% das recorrências vencidas são convertidas em transações reais dentro de um
  ciclo de processamento automático, sem qualquer intervenção manual do usuário.
- **SC-003**: Nenhuma recorrência produz mais de uma transação gerada para o mesmo ciclo
  vencido, mesmo que o processo automático seja executado mais de uma vez nesse intervalo.
- **SC-004**: Em 100% das tentativas, um usuário não consegue visualizar, editar ou remover
  uma recorrência que pertence a outro usuário.
- **SC-005**: Um usuário consegue visualizar todas as suas recorrências ativas e identificar
  qual delas irá gerar a próxima transação.

## Assumptions

- Remover uma recorrência interrompe apenas gerações futuras; transações já geradas
  anteriormente permanecem intactas no histórico do usuário.
- Editar valor, descrição, frequência ou categoria de uma recorrência afeta apenas as
  próximas gerações, não as transações já geradas.
- O processo automático de geração é disparado por um mecanismo externo agendado (ex: rotina
  periódica) e está fora do escopo desta especificação definir a infraestrutura desse
  agendamento — apenas o comportamento esperado quando ele é executado.
- Valores monetários seguem a mesma convenção de precisão/moeda já usada pelo módulo de
  transações existente.
- Uma recorrência só é elegível para geração a partir de sua data de início (inclusive) e
  deixa de ser elegível após sua data de término (se definida).
