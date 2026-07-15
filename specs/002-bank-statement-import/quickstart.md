# Quickstart: Validando a Importação de Extratos Bancários

Guia para validar manualmente o fluxo completo (User Stories 1, 2 e 3) após a implementação.
Referências de contrato em [`contracts/statement-imports-api.md`](./contracts/statement-imports-api.md)
e de modelo em [`data-model.md`](./data-model.md).

## Pré-requisitos

- Banco de dados de teste/dev migrado com as migrations desta feature (`npx prisma migrate dev`).
- Variáveis de ambiente configuradas: `OPENAI_API_KEY`, `OPENAI_MODEL` (ex: `gpt-5-mini`),
  `DATABASE_URL`, `JWT_SECRET`.
- Um usuário autenticado (token JWT válido) e ao menos uma `Category` cadastrada.
- Um arquivo de extrato de exemplo em cada formato suportado (PDF, XLSX, CSV, OFX, BBT, TXT)
  com alguns lançamentos conhecidos, para conferir manualmente o resultado da extração.

## Cenário 1 — Importar e revisar (User Stories 1 e 2)

1. `POST /v1/statement-imports` com um arquivo CSV de exemplo (multipart, campo `file`).
2. Confirmar resposta `201` com `status: "READY_FOR_REVIEW"` e `extractedTransactions`
   contendo os lançamentos esperados (comparar manualmente data/descrição/valor com o
   arquivo original).
3. `PATCH /v1/statement-imports/:id/extracted-transactions/:extractedTransactionId` alterando
   o `amount` de um item — confirmar resposta `200` com o valor corrigido.
4. `DELETE /v1/statement-imports/:id/extracted-transactions/:outroId` em outro item —
   confirmar `204`.
5. `POST /v1/statement-imports/:id/confirm` — confirmar resposta `200` com
   `createdTransactions` contendo apenas os itens não removidos, com o valor editado no passo
   3 (não o valor originalmente extraído).
6. Verificar via `GET /v1/transactions` (rota já existente) que as transações criadas
   aparecem no histórico do usuário.

**Resultado esperado**: número de `createdTransactions` = número de itens extraídos menos os
descartados; valores refletem as edições feitas antes da confirmação (SC-003).

## Cenário 2 — Todos os formatos suportados (User Story 1)

Repetir o passo 1 do Cenário 1 para cada um dos formatos: PDF, XLSX, OFX, BBT, TXT.

**Resultado esperado**: cada envio retorna `201` com `status: "READY_FOR_REVIEW"` (ou
`"NO_TRANSACTIONS_FOUND"` se o arquivo de exemplo estiver vazio) — nenhum deles deve retornar
erro de formato não suportado.

## Cenário 3 — Formato inválido / arquivo corrompido (edge case, FR-002)

1. `POST /v1/statement-imports` enviando um arquivo `.docx` ou um arquivo `.csv` corrompido
   (bytes aleatórios).

**Resultado esperado**: resposta `400` com mensagem clara do motivo; nenhum
`ExtractedTransaction` é criado.

## Cenário 4 — Nenhuma transação encontrada (FR-011)

1. `POST /v1/statement-imports` enviando um arquivo de texto válido mas sem nenhum
   lançamento reconhecível (ex: um TXT só com um cabeçalho).

**Resultado esperado**: resposta `201` com `status: "NO_TRANSACTIONS_FOUND"` e
`extractedTransactions: []` — não é tratado como erro genérico.

## Cenário 5 — Detecção de duplicatas (User Story 3)

1. Executar o Cenário 1 completo (importar e confirmar um extrato CSV).
2. Reenviar o mesmo arquivo CSV via `POST /v1/statement-imports`.
3. Verificar que os itens de `extractedTransactions` correspondentes às transações já
   confirmadas no passo 1 vêm com `isDuplicate: true`.
4. Confirmar a nova importação mesmo assim (`POST .../confirm`) e verificar que o sistema
   cria as transações normalmente (a decisão de manter ou não fica com o usuário, que poderia
   ter usado o `DELETE` para descartá-las antes).

**Resultado esperado**: itens duplicados são sinalizados antes da confirmação (SC-004), mas
a confirmação não é bloqueada por isso.

## Cenário 6 — Isolamento entre usuários (FR-013, Princípio III)

1. Com o `id` de um `StatementImport` do Usuário A, autenticar como Usuário B e chamar
   `GET /v1/statement-imports/:id`.

**Resultado esperado**: `404` (nunca `403`, nunca os dados do import de A) — SC-005.

## Cenário 7 — Falha da IA aciona o fallback determinístico (FR-015, FR-016)

1. Com `OPENAI_API_KEY` inválida ou o provider indisponível (mas o parser de fallback
   funcional), repetir o passo 1 do Cenário 1 com um arquivo OFX (formato onde o fallback é
   mais confiável — research.md, Decisão 9).

**Resultado esperado**: resposta `201` normal (não um erro), com
`extractionMethod: "FALLBACK"` no `statementImport` retornado, e `extractedTransactions`
preenchido a partir do parser determinístico — o usuário nem percebe que a IA falhou, exceto
pelo indicador de método de extração (SC-002 pode não ser atingido neste caminho, mas o fluxo
continua funcional).

## Cenário 8 — Falha de ambos os caminhos de extração (edge case, FR-012, FR-015)

1. Forçar falha tanto da IA (`OPENAI_API_KEY` inválida) quanto do fallback (ex: enviar um
   arquivo cujo conteúdo não bate com nenhum padrão reconhecível nem pela IA nem pelas regras
   determinísticas — bytes aleatórios com extensão `.txt` válida).

**Resultado esperado**: resposta `400` (`StatementExtractionFailedError`), `StatementImport`
persistido com `status: "FAILED"` e `failureReason` preenchido, consultável via
`GET /v1/statement-imports/:id`; `extractionMethod` permanece `null`.

## Testes automatizados equivalentes

Cada cenário acima MUST ter um teste e2e correspondente (`app.inject()`) e os use cases
subjacentes MUST ter testes unitários com repository fake e fakes de `IStatementFileParser`
(um simulando sucesso da IA, outro simulando falha da IA + sucesso do fallback, outro
simulando falha de ambos) — nenhuma chamada real à API da OpenAI em CI (ver
[research.md](./research.md), itens 9-11), conforme o Princípio X da constitution.
