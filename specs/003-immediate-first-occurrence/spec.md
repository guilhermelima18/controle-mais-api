# Feature Specification: Geração Imediata dos Lançamentos Devidos ao Cadastrar uma Recorrência

**Feature Branch**: `003-immediate-first-occurrence`

**Created**: 2026-07-29

**Status**: Draft

**Input**: User description: "Gerar a primeira ocorrência de uma recorrência de forma síncrona no momento da criação. Hoje, ao criar uma recorrência com data de início igual a hoje ou no passado, as transações devidas só são materializadas no próximo tick do job cron (default a cada 15 minutos). Isso faz o usuário salvar a recorrência e não ver nenhum lançamento no extrato por até 15 minutos, o que parece um defeito. A mudança: ao criar a recorrência, o próprio use case de criação deve materializar imediatamente os ciclos já devidos naquele instante (reaproveitando a lógica existente de cálculo de ciclos devidos e de atualização de lastGeneratedDate usada pelo job), e a resposta do endpoint deve informar as transações criadas. O estado final dos dados deve ser idêntico ao que o job produziria, apenas antecipado — nenhum ciclo a mais, nenhum a menos, e sem duplicar o que o job faria depois (idempotência preservada via lastGeneratedDate). Recorrências com data de início no futuro não devem gerar nada na criação. Motivação: o front-end vai passar a oferecer, na própria tela de cadastro de transação, a opção de marcar a transação como recorrente, e precisa que o lançamento apareça no extrato imediatamente após salvar."

## Contexto e Problema

Uma recorrência é um **molde**: ela descreve um lançamento que se repete, mas não é ela própria um lançamento. Quem materializa os lançamentos reais no extrato é um processamento automático que roda periodicamente em segundo plano.

Hoje, quando o usuário cadastra uma recorrência cuja data de início já chegou, o molde é salvo mas **nenhum lançamento aparece no extrato até a próxima execução desse processamento** — uma janela de até 15 minutos. Para o usuário, o dinheiro simplesmente não foi registrado: ele cadastrou uma despesa recorrente que começa hoje, foi ao extrato e não encontrou nada.

Essa janela deixa de ser um detalhe e passa a ser um defeito visível quando o cadastro de recorrência for oferecido dentro do fluxo de cadastro de uma transação comum, onde a expectativa do usuário é ver o lançamento na hora — igual a qualquer outro lançamento que ele acabou de registrar.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Lançamento aparece no extrato na hora (Priority: P1)

O usuário cadastra uma despesa que se repete todo mês, começando hoje. Ao concluir o cadastro e consultar seu extrato, o lançamento de hoje já está lá, com o valor, a descrição, a categoria e a data que ele informou — sem espera e sem precisar recarregar depois de alguns minutos.

**Why this priority**: é a razão de existir desta feature. Sem isso, o fluxo de cadastro que a motiva transmite ao usuário a impressão de que seu registro foi perdido.

**Independent Test**: cadastrar uma recorrência com início na data de hoje e, imediatamente depois, consultar o extrato do usuário — o lançamento correspondente deve estar presente, sem nenhuma execução do processamento automático no intervalo.

**Acceptance Scenarios**:

1. **Given** um usuário autenticado e uma categoria existente, **When** ele cadastra uma recorrência mensal com data de início igual a hoje, **Then** um lançamento com a data de hoje já existe no seu extrato imediatamente após a conclusão do cadastro.
2. **Given** a recorrência recém-cadastrada com o lançamento de hoje já gerado, **When** o processamento automático executa em seguida sem que o tempo avance para o próximo ciclo, **Then** nenhum lançamento adicional é criado — o extrato continua com exatamente um lançamento daquela recorrência.
3. **Given** um usuário que cadastra uma recorrência mensal com data de início há três meses, **When** o cadastro é concluído, **Then** todos os lançamentos dos ciclos já vencidos até hoje existem no extrato, um por ciclo, cada um com a data de competência do seu próprio ciclo.
4. **Given** um usuário autenticado, **When** ele cadastra uma recorrência informando uma categoria que não existe, **Then** nem a recorrência nem qualquer lançamento são criados, e ele recebe a mesma indicação de categoria inexistente que já recebia antes desta mudança.

---

### User Story 2 - Recorrência que ainda não começou não lança nada (Priority: P1)

O usuário cadastra uma assinatura que só começa a ser cobrada no mês que vem. O cadastro é aceito e a recorrência fica agendada, mas **nada** é lançado no extrato agora — o extrato do mês corrente permanece intacto.

**Why this priority**: mesma prioridade da US1 porque é a contrapartida obrigatória dela. Antecipar um lançamento futuro corromperia o saldo e o extrato do mês corrente, um dano maior do que o problema que esta feature resolve.

**Independent Test**: cadastrar uma recorrência com data de início no futuro e verificar que a contagem de lançamentos do usuário não mudou.

**Acceptance Scenarios**:

1. **Given** um usuário autenticado, **When** ele cadastra uma recorrência com data de início amanhã, **Then** nenhum lançamento é criado e seu extrato permanece exatamente como estava.
2. **Given** uma recorrência cadastrada com início no futuro, **When** o tempo avança até a data de início e o processamento automático executa, **Then** o lançamento é gerado normalmente naquele momento — o cadastro antecipado não impediu nem alterou a geração futura.

---

### User Story 3 - O app sabe o que foi lançado (Priority: P2)

Ao concluir o cadastro, o app recebe a informação de quais lançamentos foram criados naquele instante, para poder confirmar ao usuário o que aconteceu ("recorrência criada e lançamento de hoje registrado" versus "recorrência agendada para começar em 05/08") em vez de dar uma confirmação genérica.

**Why this priority**: melhora significativamente a clareza da confirmação, mas o valor central (US1 e US2) se realiza sem ela — o app poderia simplesmente reconsultar o extrato.

**Independent Test**: cadastrar uma recorrência com início hoje e verificar que o resultado do cadastro descreve o lançamento criado; repetir com início no futuro e verificar que o resultado indica que nada foi lançado.

**Acceptance Scenarios**:

1. **Given** um cadastro de recorrência com início hoje, **When** o cadastro é concluído, **Then** o resultado inclui a recorrência criada e a lista dos lançamentos gerados, com data, valor, descrição e categoria de cada um.
2. **Given** um cadastro de recorrência com início no futuro, **When** o cadastro é concluído, **Then** o resultado inclui a recorrência criada e uma lista vazia de lançamentos.

---

### Edge Cases

- **Recorrência cujo período já terminou**: início e término ambos no passado. Devem ser gerados apenas os lançamentos dos ciclos entre início e término, nenhum depois do término.
- **Recorrência com término no meio do intervalo devido**: início há seis meses, término há dois meses, frequência mensal. Gera os ciclos até o término e para — não gera os quatro meses seguintes.
- **Recorrência mensal iniciada em dia 29, 30 ou 31**: os ciclos em meses mais curtos caem no último dia daquele mês, exatamente como o processamento automático já faz hoje. Esta feature não altera esse comportamento.
- **Recorrência diária iniciada há muito tempo**: o volume de lançamentos gerados de uma vez cresce com o tempo decorrido (uma recorrência diária iniciada há dois anos produz centenas de lançamentos num único cadastro). O comportamento é o mesmo do processamento automático; o efeito é apenas que o cadastro demora mais para concluir. Ver Assumptions.
- **Falha no meio da geração**: se qualquer lançamento devido não puder ser criado, nem a recorrência nem os lançamentos daquele cadastro devem permanecer — o usuário recebe um erro e pode tentar novamente. Um estado parcial (recorrência salva com apenas parte dos lançamentos, ou lançamentos salvos sem o registro de até onde já se gerou) faria o processamento automático duplicar os lançamentos na execução seguinte.
- **Cadastro simultâneo à execução do processamento automático**: os dois caminhos produzem lançamentos para a mesma recorrência. O resultado combinado não pode conter lançamentos duplicados para o mesmo ciclo.
- **Data de início hoje, mas em horário ainda não alcançado**: a recorrência é considerada devida a partir do instante exato informado como início; se esse instante ainda não chegou, nada é gerado no cadastro. Ver Assumptions.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Ao cadastrar uma recorrência, o sistema MUST materializar imediatamente, como parte do próprio cadastro, todos os lançamentos dos ciclos já devidos naquele instante.
- **FR-002**: O conjunto de lançamentos gerados no cadastro MUST ser idêntico — em quantidade e em data de competência de cada lançamento — ao que o processamento automático produziria para aquela mesma recorrência naquele mesmo instante. Esta feature antecipa a geração; não redefine quais ciclos são devidos.
- **FR-003**: Cada lançamento gerado MUST herdar da recorrência a descrição, o valor, o tipo, a categoria e o usuário, e MUST receber como data a data de competência do seu próprio ciclo — não a data do cadastro.
- **FR-004**: Cada lançamento gerado MUST permanecer vinculado à recorrência que o originou, da mesma forma que os lançamentos produzidos pelo processamento automático, para que o app possa identificar que aquele lançamento faz parte de uma série.
- **FR-005**: Ao cadastrar uma recorrência cuja data de início ainda não chegou, o sistema MUST NOT criar nenhum lançamento.
- **FR-006**: O sistema MUST registrar até qual ciclo a geração avançou, de modo que a execução seguinte do processamento automático não recrie nenhum lançamento já gerado no cadastro.
- **FR-007**: O cadastro da recorrência e a geração dos seus lançamentos devidos MUST ser atômicos: ou a recorrência passa a existir junto com todos os seus lançamentos devidos e o registro de progresso correspondente, ou nada é persistido.
- **FR-008**: Se a geração dos lançamentos falhar, o sistema MUST reportar a falha ao solicitante e MUST NOT deixar a recorrência cadastrada em estado parcial.
- **FR-009**: O resultado do cadastro MUST informar a recorrência criada e a relação dos lançamentos gerados naquele instante, incluindo lista vazia quando nenhum ciclo estava devido.
- **FR-010**: As validações já existentes no cadastro de recorrência (campos obrigatórios, valor positivo, tipo e frequência válidos, existência da categoria, término posterior ao início) MUST continuar valendo e MUST ser aplicadas antes de qualquer lançamento ser gerado.
- **FR-011**: O sistema MUST continuar gerando lançamentos pelo processamento automático periódico para as recorrências cadastradas, tanto as anteriores quanto as posteriores a esta mudança. Esta feature não substitui o processamento automático — apenas elimina a espera do primeiro conjunto de lançamentos.
- **FR-012**: Um lançamento gerado no cadastro MUST ser indistinguível, no extrato e em todas as consultas existentes, de um lançamento gerado pelo processamento automático.
- **FR-013**: A identidade do usuário dono da recorrência e dos lançamentos gerados MUST ser derivada exclusivamente do solicitante autenticado.

### Key Entities

- **Recorrência**: o molde de um lançamento que se repete. Guarda descrição, valor, tipo (entrada ou saída), categoria, frequência, data de início, data de término opcional e o registro de até qual ciclo já foram gerados lançamentos. Pertence a um usuário.
- **Lançamento**: o registro financeiro real que aparece no extrato e compõe o saldo do usuário. Quando originado de uma recorrência, mantém o vínculo com ela.
- **Ciclo devido**: uma data de competência, derivada da frequência e da data de início da recorrência, que já chegou e para a qual ainda não foi gerado lançamento.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O intervalo entre cadastrar uma recorrência já iniciada e ver seu lançamento no extrato cai de até 15 minutos para zero — o lançamento está presente na primeira consulta ao extrato feita após o cadastro, em 100% dos casos.
- **SC-002**: 100% dos cadastros de recorrência com início no futuro não alteram o extrato nem o saldo do usuário no momento do cadastro.
- **SC-003**: Para qualquer recorrência cadastrada, a quantidade de lançamentos existentes após o cadastro seguido de uma execução do processamento automático é igual à quantidade que a execução automática produziria sozinha — zero duplicatas, verificável em 100% dos casos.
- **SC-004**: No caso comum (recorrência iniciando na data do cadastro, um único ciclo devido), o cadastro conclui em tempo percebido pelo usuário como instantâneo — indistinguível do cadastro de um lançamento comum.
- **SC-005**: Nenhuma recorrência cadastrada antes desta mudança tem seu comportamento de geração alterado: os lançamentos que ela produzirá continuam sendo os mesmos, nas mesmas datas de competência.
- **SC-006**: Um usuário não consegue, em nenhum cenário, criar recorrência ou lançamento para outro usuário, nem ver os lançamentos gerados para outro usuário.

## Assumptions

- **Nenhuma regra de negócio nova sobre quais ciclos são devidos.** A definição de ciclo devido, o tratamento de meses mais curtos e o comportamento de recuperação de ciclos passados já existem e estão validados; esta feature os reaproveita integralmente em vez de redefini-los. Qualquer divergência entre o gerado no cadastro e o gerado pelo processamento automático é defeito, não escolha.
- **Sem limite para a recuperação de ciclos passados no cadastro.** Uma recorrência com início muito antigo gera no cadastro todos os ciclos vencidos, sem teto, mantendo a paridade com o processamento automático exigida pelo FR-002. A consequência aceita é que o cadastro demora proporcionalmente mais nesse caso extremo. Limitar o volume síncrono foi descartado por reintroduzir, justamente na cauda, a espera que esta feature elimina.
- **O processamento automático periódico continua existindo sem alteração de escopo.** Ele permanece necessário para todos os ciclos futuros. Problemas conhecidos e independentes desse processamento — como a ausência de proteção contra execução concorrente em múltiplas instâncias — não entram no escopo desta feature, embora o FR-007 melhore a situação para o caminho de cadastro.
- **Momento de referência é o instante do cadastro**, com a mesma convenção de fuso já usada pelo processamento automático. Datas de início são comparadas como instantes completos, o que decide o edge case de início hoje em horário ainda não alcançado.
- **A alteração vale para todo cadastro de recorrência**, independente de onde ele é feito no app — inclusive na tela de recorrências que já existe hoje, que passa a se beneficiar da mesma correção.
- **A mudança correspondente no aplicativo web é uma feature separada**, especificada no seu próprio repositório. Esta especificação cobre apenas o comportamento do serviço e não depende daquela para entregar valor: a tela de recorrências existente já colhe o benefício.
- **Nenhuma mudança na estrutura de dados armazenada.** Recorrência, lançamento e o registro de progresso de geração já existem com todos os campos necessários.
