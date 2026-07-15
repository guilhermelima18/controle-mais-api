# Feature Specification: Importação de Extratos Bancários (Bank Statement Import)

**Feature Branch**: `002-bank-statement-import`

**Created**: 2026-07-14

**Status**: Draft

**Input**: User description: "Implemente uma funcionalidade de importação de extratos bancários suportando os seguintes formatos de arquivos: PDF, XLSX, CSV, OFX, BBT e TXT. Para fazer a leitura desses arquivos importados, adicione a inteligência artificial da OpenAI GPT-5-Mini como fonte primária da leitura, porém se falhar ou acabar os limites de tokens, terá que fazer essa extração manualmente com regex e parsers."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Importar um extrato bancário (Priority: P1)

Como usuário do Controle+, quero enviar um arquivo de extrato bancário (PDF, XLSX, CSV, OFX,
BBT ou TXT) para que o sistema identifique automaticamente as transações nele contidas, sem
que eu precise digitar cada lançamento manualmente.

**Why this priority**: É o valor central da funcionalidade — sem conseguir enviar um arquivo
e extrair transações dele, nenhuma outra parte do fluxo (revisão, confirmação, deduplicação)
tem propósito.

**Independent Test**: Pode ser testado isoladamente enviando um arquivo de extrato em cada um
dos formatos suportados e verificando que o sistema retorna uma lista de transações
identificadas (data, descrição e valor) a partir do conteúdo do arquivo.

**Acceptance Scenarios**:

1. **Given** um usuário autenticado, **When** ele envia um arquivo de extrato em um dos
   formatos suportados (PDF, XLSX, CSV, OFX, BBT ou TXT) contendo lançamentos financeiros,
   **Then** o sistema processa o arquivo e retorna a lista de transações identificadas, cada
   uma com data, descrição e valor.
2. **Given** um usuário autenticado, **When** ele envia um arquivo em um formato não suportado
   ou corrompido, **Then** o sistema rejeita a importação e informa o motivo de forma clara.
3. **Given** um usuário autenticado, **When** ele envia um arquivo de extrato vazio ou sem
   nenhum lançamento reconhecível, **Then** o sistema informa que nenhuma transação foi
   encontrada, sem gerar erro genérico.

---

### User Story 2 - Revisar e confirmar transações antes de importar (Priority: P1)

Como usuário, quero revisar as transações identificadas pelo sistema antes que elas sejam
efetivamente adicionadas ao meu histórico financeiro, para corrigir eventuais erros de leitura
e garantir que apenas os lançamentos corretos sejam confirmados.

**Why this priority**: Como a leitura do arquivo é feita por inteligência artificial, existe
risco de interpretação incorreta (valores, datas ou descrições). Permitir revisão antes da
confirmação final é essencial para a confiabilidade dos dados financeiros do usuário, e por
isso tem a mesma prioridade da extração em si.

**Independent Test**: Pode ser testado isoladamente submetendo um conjunto de transações
extraídas, editando/removendo alguns itens e confirmando a importação, verificando que apenas
os itens confirmados (com as edições aplicadas) são persistidos como transações reais.

**Acceptance Scenarios**:

1. **Given** um conjunto de transações extraídas de um extrato, **When** o usuário visualiza a
   pré-visualização antes da confirmação, **Then** ele vê cada transação com data, descrição,
   valor e tipo (receita/despesa) propostos.
2. **Given** uma pré-visualização de transações extraídas, **When** o usuário edita um campo de
   uma transação (ex: valor ou categoria) antes de confirmar, **Then** a transação é salva com
   o valor corrigido, não com o valor originalmente extraído.
3. **Given** uma pré-visualização de transações extraídas, **When** o usuário remove uma ou
   mais transações da lista antes de confirmar, **Then** essas transações não são persistidas.
4. **Given** uma pré-visualização pendente de confirmação, **When** o usuário confirma a
   importação, **Then** todas as transações restantes na lista são criadas como transações
   reais associadas a ele.

---

### User Story 3 - Evitar transações duplicadas na importação (Priority: P2)

Como usuário, quero que o sistema me avise quando uma transação identificada em um extrato
parecer já existir no meu histórico (por exemplo, por reenviar o mesmo extrato ou um extrato
com período sobreposto a uma importação anterior), para não acabar com lançamentos duplicados.

**Why this priority**: Depende logicamente de já existir extração e confirmação (Stories 1 e
2), mas é importante para a integridade dos dados no uso contínuo da funcionalidade,
especialmente quando o usuário reimporta extratos com períodos sobrepostos.

**Independent Test**: Pode ser testado isoladamente importando um extrato, confirmando as
transações, e em seguida reenviando o mesmo extrato (ou um com sobreposição de período),
verificando que as transações já existentes são sinalizadas como possíveis duplicatas na
pré-visualização.

**Acceptance Scenarios**:

1. **Given** um usuário que já importou e confirmou um extrato anteriormente, **When** ele
   importa um novo arquivo contendo transações com mesma data, valor e descrição de
   transações já existentes, **Then** o sistema sinaliza essas transações como possíveis
   duplicatas na pré-visualização, antes da confirmação.
2. **Given** transações sinalizadas como possíveis duplicatas, **When** o usuário confirma a
   importação mesmo assim, **Then** o sistema respeita a decisão do usuário e cria as
   transações normalmente.
3. **Given** transações sinalizadas como possíveis duplicatas, **When** o usuário opta por
   não incluí-las na confirmação, **Then** apenas as transações não sinalizadas (ou
   explicitamente mantidas) são criadas.

---

### Edge Cases

- O que acontece quando o arquivo enviado excede um tamanho máximo suportado?
- Como o sistema lida com um extrato em PDF que é uma imagem escaneada (sem texto
  selecionável) em vez de texto nativo?
- O que acontece se o serviço de inteligência artificial usado para leitura do arquivo estiver
  indisponível ou retornar erro no momento da importação?
- Como o sistema lida com um arquivo cujo conteúdo está em um idioma ou moeda diferente do
  padrão usado pela aplicação?
- O que acontece se o usuário fechar a tela ou perder a conexão entre o envio do arquivo e a
  confirmação da pré-visualização?
- Como o sistema lida com transações identificadas com data futura ou claramente inválida
  (ex: 31 de fevereiro)?
- O que acontece quando o mesmo arquivo é processado mas contém lançamentos que pertencem a
  contas ou moedas diferentes dentro do mesmo extrato?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O sistema MUST permitir que um usuário autenticado envie um arquivo de extrato
  bancário nos formatos PDF, XLSX, CSV, OFX, BBT ou TXT.
- **FR-002**: O sistema MUST validar o formato e a integridade do arquivo enviado antes de
  processá-lo, rejeitando arquivos em formatos não suportados ou corrompidos com uma mensagem
  clara do motivo.
- **FR-003**: O sistema MUST utilizar um serviço de inteligência artificial (GPT-5-Mini) para interpretar o conteúdo do arquivo enviado e extrair, para cada lançamento
  identificado, ao menos: data, descrição e valor.
- **FR-004**: O sistema MUST inferir, para cada transação extraída, se ela representa uma
  receita ou despesa, com base no conteúdo do extrato (ex: sinal do valor ou natureza do
  lançamento).
- **FR-005**: O sistema MUST apresentar ao usuário uma pré-visualização das transações
  extraídas antes de qualquer persistência definitiva no histórico financeiro.
- **FR-006**: O sistema MUST permitir que o usuário edite os campos de uma transação extraída
  (data, descrição, valor, tipo e categoria) antes da confirmação.
- **FR-007**: O sistema MUST permitir que o usuário remova individualmente transações da
  pré-visualização antes da confirmação, de forma que elas não sejam importadas.
- **FR-008**: O sistema MUST persistir como transações reais, associadas ao usuário
  autenticado, somente as transações presentes na pré-visualização no momento da confirmação.
- **FR-009**: O sistema MUST identificar, entre as transações extraídas, aquelas que
  aparentam ser duplicatas de transações já existentes para o mesmo usuário (mesma data,
  valor e descrição), sinalizando-as na pré-visualização antes da confirmação.
- **FR-010**: O sistema MUST permitir que o usuário decida, transação a transação, se deseja
  manter ou descartar um item sinalizado como possível duplicata antes de confirmar.
- **FR-011**: O sistema MUST informar ao usuário quando nenhuma transação for identificada em
  um arquivo enviado, sem tratar isso como um erro genérico de processamento.
- **FR-012**: O sistema MUST informar ao usuário, de forma clara, quando NEM a extração via
  inteligência artificial NEM a extração determinística de fallback (FR-015) conseguirem
  processar o arquivo, permitindo nova tentativa.
- **FR-013**: O sistema MUST garantir que um usuário não consiga importar ou visualizar
  transações extraídas em nome de outro usuário.
- **FR-014**: O sistema MUST associar toda transação criada a partir de uma importação à
  mesma categoria já usada no restante do sistema, permitindo que o usuário selecione ou
  ajuste a categoria de cada transação importada antes da confirmação.
- **FR-015**: Quando a extração via inteligência artificial (GPT-5-Mini) falhar (erro do
  serviço) ou não puder ser concluída por limite de tokens do modelo, o sistema MUST executar
  automaticamente uma extração determinística (parsers/regex específicos por formato) como
  alternativa, sem expor essa falha da IA como erro ao usuário enquanto o fallback ainda não
  tiver sido tentado.
- **FR-016**: O sistema MUST indicar, para cada extrato importado, qual método de extração foi
  efetivamente usado (inteligência artificial ou fallback determinístico), para que o usuário
  saiba quando a revisão manual (User Story 2) merece atenção redobrada.

### Key Entities _(include if feature involves data)_

- **Extrato Importado (Bank Statement Import)**: representa uma submissão de arquivo feita
  pelo usuário para importação. Atributos principais: usuário dono, nome e formato do arquivo
  original, status (recebido, processando, pronto para revisão, confirmado, falhou), método de
  extração efetivamente usado (inteligência artificial ou fallback determinístico, FR-016),
  data do envio.
- **Transação Extraída (Extracted Transaction)**: representa um lançamento identificado pela
  inteligência artificial a partir do arquivo, antes de virar uma transação real. Atributos
  principais: data, descrição, valor, tipo (receita/despesa) inferido, categoria sugerida,
  indicador de possível duplicata, extrato importado de origem.
- **Transação (Transaction)**: registro financeiro real, já existente no sistema, criado a
  partir de uma transação extraída quando o usuário confirma a importação.
- **Categoria (Category)**: classificação já existente no sistema, associada às transações
  criadas a partir da importação.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Um usuário consegue importar um extrato bancário e visualizar as transações
  extraídas em menos de 30 segundos após o envio do arquivo, para arquivos de tamanho típico
  (até algumas centenas de lançamentos).
- **SC-002**: Ao menos 90% dos lançamentos presentes em um extrato bem formatado, nos formatos
  suportados, são corretamente identificados (data, descrição e valor) pelo sistema sem
  intervenção manual do usuário.
- **SC-003**: 100% das transações efetivamente criadas no histórico do usuário correspondem a
  itens que estavam presentes na pré-visualização no momento da confirmação, nunca a itens já
  removidos ou não revisados.
- **SC-004**: Um usuário consegue identificar, na pré-visualização, quais transações
  importadas são possíveis duplicatas de lançamentos já existentes, antes de confirmar a
  importação.
- **SC-005**: Em 100% das tentativas, um usuário não consegue visualizar ou importar
  transações extraídas pertencentes a outro usuário.
- **SC-006**: Quando o arquivo enviado não contém nenhum lançamento reconhecível ou está em
  formato inválido, o usuário recebe uma mensagem específica explicando o motivo em vez de um
  erro genérico.

## Assumptions

- O serviço de inteligência artificial usado para interpretar os arquivos importados é o
  OpenAI GPT-5-Mini, conforme decisão explícita do solicitante da funcionalidade; a
  especificação trata isso como uma dependência externa fixa, não como uma escolha de
  implementação em aberto. Quando esse serviço falhar ou esgotar o limite de tokens (FR-015),
  a extração determinística de fallback (regex/parsers por formato) tende a ter cobertura e
  precisão menores que a IA, especialmente para PDF e BBT; a revisão manual da
  pré-visualização (User Story 2) é o mecanismo que compensa essa diferença de qualidade, e o
  indicador de método de extração (FR-016) é o que sinaliza ao usuário quando essa atenção
  redobrada é necessária.
- Existe um tamanho máximo de arquivo suportado por importação (ex: alguns megabytes),
  seguindo práticas comuns de upload de documentos; o valor exato é um detalhe de
  implementação a ser definido na fase de planejamento.
- Arquivos em PDF são tratados quando contêm texto extraível; extratos em PDF puramente
  escaneados (imagem sem camada de texto) podem ter taxa de reconhecimento reduzida, mas o
  fluxo de revisão manual (User Story 2) cobre a correção desses casos.
- Transações importadas seguem a mesma convenção de moeda e precisão já usada pelo módulo de
  transações existente.
- A importação é um processo síncrono do ponto de vista do usuário (ele aguarda a
  pré-visualização após o envio do arquivo); processamento em segundo plano de arquivos muito
  grandes é um detalhe de implementação fora do escopo desta especificação.
- A detecção de duplicatas (User Story 3) é feita por semelhança de data, valor e descrição
  dentro do histórico do próprio usuário, não exigindo integração com sistemas bancários
  externos para conciliação.
