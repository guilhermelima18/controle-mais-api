# Phase 0 Research: Importação de Extratos Bancários

## 1. SDK de integração com o OpenAI GPT-5-Mini

- **Decision**: usar o SDK oficial Node/TypeScript `openai`, autenticando por API key
  (`OPENAI_API_KEY` em `config/env.ts`, seguindo o padrão de leitura única de `process.env`
  já estabelecido pela constitution). Modelo fixado como `gpt-5-mini` numa constante/env
  (`OPENAI_MODEL`), não hardcoded espalhado pelo código. Chamada via Chat/Responses API com
  saída estruturada (JSON mode / `response_format: { type: "json_schema" }`) descrevendo um
  array de transações.
- **Rationale**: é o SDK mantido pela OpenAI, suporta forçar saída em JSON estruturado
  (reduzindo parsing frágil de texto livre) e é o provedor explicitamente decidido pelo
  solicitante da funcionalidade (spec.md, FR-003), substituindo a escolha inicial (Google
  Gemini 1.5 Flash).
- **Alternatives considered**: Google Gemini 1.5 Flash — descartado após decisão explícita do
  usuário de trocar o provedor de IA para OpenAI GPT-5-Mini (não é mais uma opção em aberto,
  é uma mudança de requisito); chamar a REST API da OpenAI diretamente via `fetch` —
  rejeitado (reimplementaria serialização/tratamento de erro que o SDK já resolve, sem
  benefício real).

## 2. Estratégia de leitura por formato de arquivo (texto compartilhado entre IA e fallback)

- **Decision**: converter todo arquivo, independente do formato, para uma única representação
  textual (`extractStatementText(fileBuffer, format): Promise<string>`) **antes** de qualquer
  tentativa de extração — essa mesma string de texto alimenta tanto o GPT-5-Mini (Decisão 1)
  quanto o parser determinístico de fallback (Decisão 9), evitando duas pipelines de
  pré-processamento divergentes:
  - **PDF**: texto extraído da camada de texto do PDF via biblioteca de parsing de PDF
    (`pdf-parse` ou equivalente); PDFs puramente escaneados (sem camada de texto) produzem
    string vazia/quase vazia — tratado como "nenhuma transação encontrada", não como erro
    (FR-011).
  - **XLSX**: convertido para texto (CSV por planilha) com a biblioteca `xlsx`.
  - **CSV / TXT**: lido como texto (UTF-8, com fallback de detecção de encoding para arquivos
    legados em Latin-1, comum em exports bancários brasileiros mais antigos).
  - **OFX**: é um formato baseado em SGML/XML já textual; lido como texto sem conversão.
  - **BBT**: tratado como texto bancário proprietário/posicional; lido como texto puro.
- **Rationale**: unificar o pré-processamento em uma única função de texto por arquivo
  simplifica o prompt da IA (sempre recebe texto, nunca binário) e, mais importante, permite
  que o fallback determinístico (Decisão 9) reaproveite exatamente o mesmo texto já extraído
  quando a IA falha ou estoura o limite de tokens (FR-015) — sem re-processar o arquivo
  original nem manter duas implementações de leitura por formato.
- **Alternatives considered**: enviar cada formato em sua representação nativa diretamente à
  IA (ex: PDF multimodal inline) — rejeitado porque acoplaria o pré-processamento a
  capacidades específicas do provedor de IA escolhido e impediria o reaproveitamento do mesmo
  texto pelo fallback determinístico; manter pipelines de leitura separadas para IA e
  fallback — rejeitado por duplicar lógica de parsing por formato sem necessidade (Princípio
  IX, YAGNI).

## 3. Saída estruturada e validação da resposta do modelo

- **Decision**: solicitar ao GPT-5-Mini uma resposta em JSON estruturado
  (`response_format: { type: "json_schema" }` descrevendo um array de `{ date, description,
  amount, type }`), e validar essa resposta no adapter com um schema Zod antes de repassá-la
  ao use case. Itens que não validam são descartados individualmente (não derrubam a
  importação inteira), e um total de itens rejeitados é logado.
- **Rationale**: um schema de resposta reduz a chance de o modelo devolver texto livre ou
  markdown ao redor do JSON; validar novamente no adapter (defesa em profundidade) garante
  que o use case nunca recebe um formato inesperado, mantendo o Princípio IV (erros tipados)
  — resposta totalmente inválida (ou qualquer erro da chamada, incluindo estouro de limite de
  tokens) faz o adapter da IA lançar, o que aciona o fallback determinístico (Decisão 9/10) em
  vez de propagar o erro direto ao use case.
- **Alternatives considered**: parsing de texto livre com regex como único mecanismo —
  rejeitado por fragilidade; confiar cegamente no JSON sem revalidar — rejeitado por não haver
  garantia forte de que o modelo sempre respeita o schema solicitado.

## 4. Limite de tamanho de arquivo

- **Decision**: limite de 10MB por arquivo importado, aplicado via configuração de limites do
  plugin de upload multipart (rejeição antes mesmo de ler o conteúdo completo em memória).
- **Rationale**: cobre extratos de várias páginas/centenas de linhas com folga, mantém o
  processamento dentro da janela síncrona de 30s (SC-001) e evita payloads que estourem
  limites práticos de requisição/tokens do GPT-5-Mini.
- **Alternatives considered**: sem limite — rejeitado (risco de payloads grandes travarem o
  processamento síncrono ou estourar limites de tokens da API da OpenAI); limite bem menor
  (ex: 1MB) — rejeitado por poder cortar extratos legítimos de vários meses.

## 5. Upload de arquivo via HTTP

- **Decision**: usar `@fastify/multipart` (plugin oficial do ecossistema Fastify, já usado
  pelo framework HTTP do projeto) para receber o arquivo via `multipart/form-data`, com
  `limits.fileSize` configurado conforme o item 4.
- **Rationale**: integra-se diretamente ao Fastify já usado no projeto, sem introduzir um
  segundo framework/middleware de upload.
- **Alternatives considered**: aceitar o arquivo como base64 dentro de um JSON comum —
  rejeitado por inflar o payload em ~33% e fugir da convenção usual de upload de arquivos em
  APIs REST.

## 6. Persistência do arquivo original

- **Decision**: armazenar o conteúdo bruto do arquivo (`Bytes` no Postgres, via Prisma) na
  própria linha de `StatementImport`, junto com nome e formato originais.
- **Rationale**: permite reprocessamento (nova tentativa após falha de ambos os caminhos de
  extração, FR-012) sem exigir que o usuário reenvie o arquivo, sem depender de um serviço de
  object storage externo (S3, etc.) — desnecessário para o volume e escopo desta feature
  (Princípio IX).
- **Alternatives considered**: object storage externo (S3/GCS) com apenas a referência salva
  no banco — rejeitado por adicionar uma dependência de infraestrutura nova sem necessidade
  comprovada no porte atual do projeto; não persistir o arquivo e exigir reenvio manual em
  caso de falha — rejeitado por piorar a experiência descrita em FR-012 ("permitindo nova
  tentativa").

## 7. Detecção de duplicatas

- **Decision**: verificação determinística (consulta ao repository de transações reais já
  existente), não delegada a nenhum modelo de IA — para cada transação extraída, buscar
  transações do mesmo usuário com mesma data, mesmo valor e descrição igual ou muito
  semelhante (comparação normalizada: case-insensitive, trim, sem acentuação). Se encontrada,
  marcar `isDuplicate = true` na `ExtractedTransaction`, sem bloquear a confirmação.
- **Rationale**: duplicidade é uma checagem estrutural contra dados que o sistema já possui
  (Principio V — via repository), não uma tarefa de interpretação de linguagem natural;
  manter essa lógica determinística e testável unitariamente com um repository fake (Princípio X),
  em vez de pedir a um modelo de IA para "adivinhar" duplicatas — o que também a torna
  independente de qual caminho de extração (IA ou fallback, Decisão 9/10) gerou a transação.
- **Alternatives considered**: pedir ao próprio GPT-5-Mini para comparar com o histórico —
  rejeitado (exigiria enviar todo o histórico financeiro do usuário ao modelo a cada
  importação, sem necessidade, tornaria o resultado não determinístico/não testável, e não
  funcionaria quando a extração cai no fallback determinístico).

## 8. Sugestão de categoria

- **Decision**: o prompt ao GPT-5-Mini pode incluir a lista de nomes de categorias já
  existentes no sistema e pedir que o modelo sugira, por transação, o nome de categoria mais
  adequado dentre essas opções (ou nenhum, se não houver correspondência clara). O adapter
  então resolve esse nome sugerido para um `categoryId` existente (correspondência exata
  case-insensitive); sem correspondência, `categoryId` fica `null` na `ExtractedTransaction`
  até o usuário selecionar manualmente antes da confirmação. O parser de fallback (Decisão 9)
  não tenta sugerir categoria (não tem capacidade de interpretação semântica) — todo item
  extraído por fallback nasce com `categoryId = null`, sempre exigindo seleção manual antes da
  confirmação.
- **Rationale**: atende FR-014 (categoria sugerida, ajustável pelo usuário) sem exigir que o
  modelo invente categorias novas fora do domínio já cadastrado pelo usuário/sistema; deixar o
  fallback sempre sem sugestão é consistente com sua natureza puramente sintática (regex/parsers
  não "entendem" o significado de uma descrição de lançamento).
- **Alternatives considered**: deixar o modelo gerar uma categoria livre em texto e criar uma
  `Category` nova automaticamente — rejeitado por poder gerar categorias duplicadas/confusas
  sem curadoria do usuário, fora do escopo desta especificação; tentar heurísticas de
  categoria também no fallback (ex: palavras-chave fixas) — rejeitado por escopo mínimo
  (Princípio IX) e por gerar uma segunda fonte de heurística para manter.

## 9. Fallback determinístico por formato (FR-015)

- **Decision**: implementar um `DeterministicStatementFileParser` — parsers/regex específicos
  por formato, sem qualquer chamada de IA — usado apenas quando a chamada ao GPT-5-Mini falha
  (erro de serviço, rede, ou estouro de limite de tokens do modelo):
  - **OFX**: parsing por regex sobre as tags SGML/XML do próprio formato (`<STMTTRN>`,
    `<DTPOSTED>`, `<TRNAMT>`, `<MEMO>`/`<NAME>`) — é o caso de maior confiança do fallback,
    porque o OFX já é estruturado por natureza.
  - **CSV**: parsing de colunas via delimitador (`,`/`;`) com heurística de cabeçalho
    (colunas candidatas a data/descrição/valor por nome e por formato do conteúdo).
  - **XLSX**: leitura direta das linhas/células via `xlsx` (sem passar pela conversão a texto
    da Decisão 2 nesse caminho específico), aplicando a mesma heurística de colunas do CSV.
  - **TXT / BBT**: aplicação de padrões de regex genéricos para reconhecer datas (`dd/mm/aaaa`
    e variantes) e valores monetários (`R$`, separador decimal `,`) em cada linha, associando o
    texto restante da linha como descrição — cobertura menor que os demais formatos, por não
    haver estrutura fixa amplamente padronizada para BBT.
  - **PDF**: aplica os mesmos padrões de regex de TXT/BBT sobre o texto já extraído na Decisão
    2; se o PDF for escaneado (texto vazio), o fallback também não encontra nada — mesmo
    comportamento de "nenhuma transação encontrada" (FR-011), não um erro.
- **Rationale**: atende FR-015 (fallback obrigatório quando a IA falha ou estoura limite de
  tokens) sem introduzir uma segunda dependência de IA; cada formato usa a estratégia
  determinística mais confiável disponível para sua estrutura (tags para OFX, colunas para
  CSV/XLSX, regex genérica para TXT/BBT/PDF).
- **Alternatives considered**: um único parser genérico de regex para todos os formatos —
  rejeitado por ignorar a estrutura já conhecida de OFX/CSV/XLSX, reduzindo a qualidade do
  fallback justamente nos formatos onde ele poderia ser mais confiável que a própria IA.

## 10. Composição IA + fallback e rastreamento do método usado (FR-015, FR-016)

- **Decision**: `StatementFileParserWithFallback` implementa `IStatementFileParser` e recebe o
  parser primário (OpenAI, Decisão 1) e o de fallback (Decisão 9) via construtor. `parse()`
  chama o primário; qualquer erro lançado por ele (falha de serviço, erro de rede, estouro de
  limite de tokens, resposta inválida mesmo após a revalidação da Decisão 3) é capturado e
  registrado (log), e o fallback é chamado em seguida. Somente se o fallback **também** lançar
  é que `StatementExtractionFailedError` propaga ao use case (FR-012). O retorno de `parse()`
  passa a incluir qual caminho foi efetivamente usado (`{ transactions, method: "AI" |
  "FALLBACK" }`), persistido como `extractionMethod` em `StatementImport` (FR-016,
  data-model.md).
- **Rationale**: mantém `ImportStatementUseCase` (US1) completamente alheio à existência do
  fallback — ele depende apenas da porta `IStatementFileParser`, então a troca de "só IA" para
  "IA com fallback" é inteiramente uma decisão de composição na factory
  (`make-statement-file-parser.ts`), sem alterar o use case; expor `extractionMethod` ao
  usuário é o que sustenta FR-016 (saber quando a revisão manual merece atenção redobrada).
- **Alternatives considered**: colocar a lógica de fallback dentro do próprio adapter da
  OpenAI (`try/catch` interno chamando o parser determinístico) — rejeitado por violar
  responsabilidade única (o adapter da OpenAI deixaria de ser testável isoladamente da lógica
  de fallback) e por acoplar os dois parsers entre si sem necessidade; colocar a lógica de
  fallback no próprio use case — rejeitado por vazar uma decisão de infraestrutura (qual
  provider usar) para a camada de aplicação, o que a porta `IStatementFileParser` existe
  justamente para evitar.

## 11. Testes contra a IA real e contra o fallback

- **Decision**: `IStatementFileParser` é injetado no use case `import-statement`; testes
  unitários usam uma implementação fake determinística (sem rede) tanto para o caminho "só
  sucesso da IA" quanto para os cenários em que o fake primário lança erro (para validar que o
  fallback é acionado e que `extractionMethod` reflete corretamente qual caminho respondeu).
  Testes e2e sobem a aplicação real via `app.inject()` mas com uma instância de teste do
  provider (fake) — nunca chamando a API real da OpenAI em CI.
- **Rationale**: exigido pelo Princípio X (nenhum teste unitário ou e2e deve depender de
  serviço externo real); chamadas reais à API da OpenAI custam dinheiro, são não
  determinísticas e tornariam a suíte de testes instável — e o comportamento de fallback
  (Decisão 10) só é confiavelmente testável forçando a falha do parser primário, o que exige
  um fake controlável, não uma chamada real.
- **Alternatives considered**: gravar/reproduzir respostas reais da OpenAI (cassette/VCR) —
  possível melhoria futura, fora do escopo mínimo desta feature.

## Resumo

Todas as incógnitas técnicas identificadas no Technical Context do plano foram resolvidas
acima. Nenhum item permanece como `NEEDS CLARIFICATION`.
