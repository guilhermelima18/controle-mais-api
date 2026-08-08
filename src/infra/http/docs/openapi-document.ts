/**
 * Documento OpenAPI escrito manualmente (modo `static` do @fastify/swagger).
 * Nenhuma rota declara `schema` do Fastify (ver CLAUDE.md), então gerar a
 * especificação a partir das rotas não é possível sem adicionar validação/
 * serialização ao framework — o que mudaria o comportamento em produção.
 * Este documento é mantido manualmente e deve ser atualizado junto com as
 * rotas quando elas mudarem de contrato.
 */
export const openapiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Controle+ API",
    description:
      "API REST de controle financeiro pessoal (pt-BR). Autenticação via JWT (Bearer). " +
      "Contrato de erro é heterogêneo por desenho atual do projeto: erros de negócio " +
      "(`AppError`) respondem `{ \"error\": string }` com o `statusCode` do erro; falhas " +
      "de autenticação JWT respondem 401 `{ \"message\": \"Não autorizado\" }`; erros de " +
      "validação (Zod) respondem 400 `{ \"errors\": [{ \"campo\": string, \"message\": string }] }`.",
    version: "1.0.0",
  },
  servers: [{ url: "http://localhost:3333", description: "Desenvolvimento local" }],
  tags: [
    { name: "Auth" },
    { name: "Users" },
    { name: "Categories" },
    { name: "Transactions" },
    { name: "Recurring Transactions" },
    { name: "Statement Imports" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          'Token retornado por `POST /v1/auth`. Envie como `Authorization: Bearer <token>`.',
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: { error: { type: "string" } },
        required: ["error"],
      },
      UnauthorizedResponse: {
        type: "object",
        description: "Falha de autenticação JWT (token ausente, inválido ou expirado).",
        properties: { message: { type: "string", example: "Não autorizado" } },
        required: ["message"],
      },
      ValidationErrorResponse: {
        type: "object",
        properties: {
          errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                campo: { type: "string" },
                message: { type: "string" },
              },
            },
          },
        },
        required: ["errors"],
      },
      SuccessMessage: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string" },
        },
        required: ["success", "message"],
      },
      TransactionType: {
        type: "string",
        enum: ["INCOME", "EXPENSE"],
      },
      RecurringFrequency: {
        type: "string",
        enum: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"],
      },
      Category: {
        type: "object",
        description: "Categorias são globais (não têm userId); `name` é único.",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          type: { $ref: "#/components/schemas/TransactionType" },
        },
      },
      CreateCategoryInput: {
        type: "object",
        properties: {
          name: { type: "string" },
          type: { type: "string", description: "Não validado como enum pelo Zod hoje (dívida mapeada)." },
        },
        required: ["name", "type"],
      },
      UserPublic: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          cpf: { type: "string" },
          email: { type: "string", format: "email" },
        },
      },
      AuthUser: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
        },
      },
      CreateUserInput: {
        type: "object",
        properties: {
          name: { type: "string" },
          cpf: { type: "string" },
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 6 },
        },
        required: ["name", "cpf", "email", "password"],
      },
      AuthenticateInput: {
        type: "object",
        properties: {
          cpf: { type: "string", description: "Normalizado internamente (remove tudo que não for dígito)." },
          password: { type: "string", minLength: 6 },
        },
        required: ["cpf", "password"],
      },
      AuthenticateResponse: {
        type: "object",
        properties: {
          user: { $ref: "#/components/schemas/AuthUser" },
          token: { type: "string", description: "JWT, expira em 7 dias." },
        },
      },
      TransactionCategoryRef: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          type: { $ref: "#/components/schemas/TransactionType" },
        },
      },
      Transaction: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          description: { type: "string" },
          amount: {
            type: "string",
            description: "Prisma Decimal serializado como string.",
            example: "150.90",
          },
          type: { $ref: "#/components/schemas/TransactionType" },
          date: { type: "string", format: "date-time" },
          userId: { type: "string", format: "uuid" },
          categoryId: { type: "string", format: "uuid" },
          recurringTransactionId: { type: "string", format: "uuid", nullable: true },
          extractedTransactionId: { type: "string", format: "uuid", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          category: {
            allOf: [{ $ref: "#/components/schemas/TransactionCategoryRef" }],
            nullable: true,
          },
        },
      },
      CreateTransactionInput: {
        type: "object",
        properties: {
          description: { type: "string" },
          amount: { type: "number" },
          type: { type: "string", description: "Não validado como enum pelo Zod hoje (dívida mapeada)." },
          date: { type: "string", format: "date-time" },
          categoryId: { type: "string", format: "uuid" },
        },
        required: ["description", "amount", "type", "date", "categoryId"],
      },
      UpdateTransactionInput: {
        type: "object",
        properties: {
          description: { type: "string" },
          amount: { type: "number" },
          type: { type: "string" },
          date: { type: "string", format: "date-time" },
          categoryId: { type: "string", format: "uuid" },
        },
      },
      TransactionsPageMeta: {
        type: "object",
        properties: {
          totalItems: { type: "integer" },
          currentPage: { type: "integer" },
          totalPages: { type: "integer" },
          itemsPerPage: { type: "integer" },
        },
      },
      TransactionsPage: {
        type: "object",
        properties: {
          data: { type: "array", items: { $ref: "#/components/schemas/Transaction" } },
          meta: { $ref: "#/components/schemas/TransactionsPageMeta" },
        },
      },
      DashboardCategoryBreakdown: {
        type: "object",
        properties: {
          name: { type: "string" },
          value: { type: "number" },
          percentage: { type: "number" },
        },
      },
      Dashboard: {
        type: "object",
        description: "Agregado do mês corrente (UTC) para o usuário autenticado.",
        properties: {
          total: { type: "number" },
          income: { type: "number" },
          expense: { type: "number" },
          perType: {
            type: "object",
            properties: {
              income: {
                type: "array",
                items: { $ref: "#/components/schemas/DashboardCategoryBreakdown" },
              },
              expense: {
                type: "array",
                items: { $ref: "#/components/schemas/DashboardCategoryBreakdown" },
              },
            },
          },
        },
      },
      RecurringTransaction: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          description: { type: "string" },
          amount: { type: "string", example: "150.90" },
          type: { $ref: "#/components/schemas/TransactionType" },
          frequency: { $ref: "#/components/schemas/RecurringFrequency" },
          startDate: { type: "string", format: "date-time" },
          endDate: { type: "string", format: "date-time", nullable: true },
          lastGeneratedDate: { type: "string", format: "date-time", nullable: true },
          userId: { type: "string", format: "uuid" },
          categoryId: { type: "string", format: "uuid" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CreateRecurringTransactionInput: {
        type: "object",
        properties: {
          description: { type: "string" },
          amount: { type: "number", exclusiveMinimum: 0 },
          type: { $ref: "#/components/schemas/TransactionType" },
          frequency: { $ref: "#/components/schemas/RecurringFrequency" },
          startDate: { type: "string", format: "date-time" },
          endDate: { type: "string", format: "date-time" },
          categoryId: { type: "string", format: "uuid" },
        },
        required: ["description", "amount", "type", "frequency", "startDate", "categoryId"],
      },
      UpdateRecurringTransactionInput: {
        type: "object",
        properties: {
          description: { type: "string" },
          amount: { type: "number", exclusiveMinimum: 0 },
          type: { $ref: "#/components/schemas/TransactionType" },
          frequency: { $ref: "#/components/schemas/RecurringFrequency" },
          startDate: { type: "string", format: "date-time" },
          endDate: { type: "string", format: "date-time" },
          categoryId: { type: "string", format: "uuid" },
        },
      },
      CreateRecurringTransactionResponse: {
        type: "object",
        description:
          "Além de criar a recorrência, antecipa os ciclos já devidos (mesma lógica do job) e retorna as transações materializadas.",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string" },
          recurringTransaction: { $ref: "#/components/schemas/RecurringTransaction" },
          createdTransactions: {
            type: "array",
            items: { $ref: "#/components/schemas/Transaction" },
          },
        },
      },
      StatementFileFormat: {
        type: "string",
        enum: ["PDF", "XLSX", "CSV", "OFX", "BBT", "TXT"],
      },
      StatementImportStatus: {
        type: "string",
        enum: [
          "RECEIVED",
          "PROCESSING",
          "READY_FOR_REVIEW",
          "NO_TRANSACTIONS_FOUND",
          "CONFIRMED",
          "FAILED",
        ],
      },
      StatementImport: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          fileName: { type: "string" },
          fileFormat: { $ref: "#/components/schemas/StatementFileFormat" },
          status: { $ref: "#/components/schemas/StatementImportStatus" },
          extractionMethod: {
            type: "string",
            enum: ["AI", "FALLBACK"],
            nullable: true,
          },
          failureReason: { type: "string", nullable: true },
          userId: { type: "string", format: "uuid" },
          createdAt: { type: "string", format: "date-time" },
          confirmedAt: { type: "string", format: "date-time", nullable: true },
        },
      },
      ExtractedTransaction: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          date: { type: "string", format: "date-time" },
          description: { type: "string" },
          amount: { type: "string", example: "42.50" },
          type: { $ref: "#/components/schemas/TransactionType" },
          isDuplicate: {
            type: "boolean",
            description:
              "true quando data+valor+descrição normalizada (NFD, sem diacríticos, lowercase) já existe para o usuário.",
          },
          discarded: { type: "boolean" },
          statementImportId: { type: "string", format: "uuid" },
          categoryId: { type: "string", format: "uuid", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      ImportStatementResponse: {
        type: "object",
        properties: {
          statementImport: { $ref: "#/components/schemas/StatementImport" },
          extractedTransactions: {
            type: "array",
            items: { $ref: "#/components/schemas/ExtractedTransaction" },
          },
        },
      },
      UpdateExtractedTransactionInput: {
        type: "object",
        description: "Ao menos um campo deve ser informado.",
        properties: {
          date: { type: "string", format: "date-time" },
          description: { type: "string" },
          amount: { type: "number", exclusiveMinimum: 0 },
          type: { $ref: "#/components/schemas/TransactionType" },
          categoryId: { type: "string", format: "uuid" },
        },
      },
      ConfirmStatementImportResponse: {
        type: "object",
        properties: {
          statementImport: { $ref: "#/components/schemas/StatementImport" },
          createdTransactions: {
            type: "array",
            items: { $ref: "#/components/schemas/Transaction" },
          },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: "Token JWT ausente, inválido ou expirado.",
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/UnauthorizedResponse" } },
        },
      },
      ValidationError: {
        description: "Corpo/query/params não passaram na validação Zod.",
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/ValidationErrorResponse" } },
        },
      },
      NotFound: {
        description: "Recurso não encontrado (ou pertence a outro usuário — resposta é sempre 404, nunca 403).",
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
        },
      },
      AppErrorResponse: {
        description: "Erro de negócio.",
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/v1/auth": {
      post: {
        tags: ["Auth"],
        summary: "Autenticar por CPF + senha",
        security: [],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/AuthenticateInput" } } },
        },
        responses: {
          "200": {
            description: "Autenticado.",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/AuthenticateResponse" } },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": {
            description: "CPF ou senha incorretos.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
    "/v1/users": {
      post: {
        tags: ["Users"],
        summary: "Criar usuário",
        security: [],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateUserInput" } } },
        },
        responses: {
          "201": {
            description: "Usuário criado.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessMessage" } } },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": {
            description:
              "CPF já cadastrado. Status divergente do padrão REST (deveria ser 409) — dívida mapeada.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
      get: {
        tags: ["Users"],
        summary: "Listar usuários",
        description:
          "⚠️ Expõe CPF e e-mail de todos os usuários para qualquer autenticado, sem paginação nem RBAC (dívida mapeada).",
        responses: {
          "200": {
            description: "Lista de usuários.",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/UserPublic" } },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/v1/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "Buscar usuário por id",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": {
            description: "Usuário encontrado.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/UserPublic" } } },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/v1/categories": {
      post: {
        tags: ["Categories"],
        summary: "Criar categoria",
        description: "Categorias são globais — não pertencem a um usuário e `name` é único.",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateCategoryInput" } } },
        },
        responses: {
          "201": {
            description: "Categoria criada.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessMessage" } } },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
      get: {
        tags: ["Categories"],
        summary: "Listar categorias",
        responses: {
          "200": {
            description: "Lista de categorias.",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Category" } },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/v1/categories/{id}": {
      get: {
        tags: ["Categories"],
        summary: "Buscar categoria por id",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": {
            description: "Categoria encontrada.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Category" } } },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/v1/transactions": {
      post: {
        tags: ["Transactions"],
        summary: "Criar transação",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateTransactionInput" } } },
        },
        responses: {
          "201": {
            description: "Transação criada.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessMessage" } } },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
      get: {
        tags: ["Transactions"],
        summary: "Listar transações do usuário (com filtros e paginação)",
        parameters: [
          { name: "search", in: "query", schema: { type: "string" }, description: "Busca por descrição." },
          { name: "type", in: "query", schema: { $ref: "#/components/schemas/TransactionType" } },
          { name: "category", in: "query", schema: { type: "string", format: "uuid" }, description: "categoryId" },
          { name: "initialDate", in: "query", schema: { type: "string", format: "date" } },
          { name: "finalDate", in: "query", schema: { type: "string", format: "date" } },
          { name: "page", in: "query", schema: { type: "string", example: "1" } },
          { name: "perPage", in: "query", schema: { type: "string", example: "3" }, description: "Default: 3." },
        ],
        responses: {
          "200": {
            description: "Página de transações.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/TransactionsPage" } } },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/v1/transactions/dashboard": {
      get: {
        tags: ["Transactions"],
        summary: "Resumo de receitas/despesas do mês corrente",
        responses: {
          "200": {
            description: "Totais e breakdown por categoria do mês corrente (UTC).",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Dashboard" } } },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/v1/transactions/{id}": {
      get: {
        tags: ["Transactions"],
        summary: "Buscar transação por id",
        description:
          "⚠️ Não retorna 404: se o id não existir (ou pertencer a outro usuário), responde 200 com corpo `null` (dívida mapeada — diverge dos outros módulos).",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": {
            description: "Transação encontrada, ou `null` se não existir.",
            content: {
              "application/json": {
                schema: {
                  oneOf: [{ $ref: "#/components/schemas/Transaction" }, { type: "null" }],
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
      put: {
        tags: ["Transactions"],
        summary: "Atualizar transação",
        description: "⚠️ Responde 201 em vez de 200 (dívida mapeada).",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateTransactionInput" } } },
        },
        responses: {
          "201": {
            description: "Transação atualizada (status divergente: deveria ser 200).",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessMessage" } } },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Transactions"],
        summary: "Excluir transação",
        description: "⚠️ Responde 201 em vez de 200/204 (dívida mapeada).",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "201": {
            description: "Transação excluída (status divergente: deveria ser 200/204).",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessMessage" } } },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/v1/recurring-transactions": {
      post: {
        tags: ["Recurring Transactions"],
        summary: "Criar recorrência",
        description:
          "Cria a recorrência e materializa imediatamente os ciclos já devidos (mesma lógica do job cron), para não depender do próximo agendamento.",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/CreateRecurringTransactionInput" } },
          },
        },
        responses: {
          "201": {
            description: "Recorrência criada.",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/CreateRecurringTransactionResponse" } },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": {
            description: "Categoria informada não existe.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
      get: {
        tags: ["Recurring Transactions"],
        summary: "Listar recorrências do usuário",
        responses: {
          "200": {
            description: "Lista de recorrências.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/RecurringTransaction" } },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/v1/recurring-transactions/{id}": {
      get: {
        tags: ["Recurring Transactions"],
        summary: "Buscar recorrência por id",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": {
            description: "Recorrência encontrada.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/RecurringTransaction" } } },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      put: {
        tags: ["Recurring Transactions"],
        summary: "Atualizar recorrência",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/UpdateRecurringTransactionInput" } },
          },
        },
        responses: {
          "200": {
            description: "Recorrência atualizada.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessMessage" } } },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Recurring Transactions"],
        summary: "Excluir recorrência",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": {
            description: "Recorrência excluída.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessMessage" } } },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/v1/statement-imports": {
      post: {
        tags: ["Statement Imports"],
        summary: "Importar extrato (PDF/XLSX/CSV/OFX/BBT/TXT)",
        description:
          "multipart/form-data com um único arquivo. O texto extraído é enviado à OpenAI (gpt-5-mini) com fallback determinístico (regex/parsers) transparente em caso de falha. Duplicatas são marcadas (não bloqueadas) comparando data+valor+descrição normalizada.",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: { file: { type: "string", format: "binary" } },
                required: ["file"],
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Arquivo processado (revisão pendente antes da confirmação).",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ImportStatementResponse" } },
            },
          },
          "400": {
            description:
              "Nome de arquivo ausente, formato não suportado, arquivo maior que o limite configurado, ou falha de extração.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/v1/statement-imports/{id}": {
      get: {
        tags: ["Statement Imports"],
        summary: "Buscar importação por id (com transações extraídas)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": {
            description: "Importação e suas transações extraídas.",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ImportStatementResponse" } },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/v1/statement-imports/{id}/extracted-transactions/{extractedTransactionId}": {
      patch: {
        tags: ["Statement Imports"],
        summary: "Editar transação extraída (antes da confirmação)",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" }, description: "statementImportId" },
          { name: "extractedTransactionId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/UpdateExtractedTransactionInput" } },
          },
        },
        responses: {
          "200": {
            description: "Transação extraída atualizada.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ExtractedTransaction" } } },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Statement Imports"],
        summary: "Descartar transação extraída (não será criada na confirmação)",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" }, description: "statementImportId" },
          { name: "extractedTransactionId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "204": { description: "Descartada com sucesso." },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/v1/statement-imports/{id}/confirm": {
      post: {
        tags: ["Statement Imports"],
        summary: "Confirmar importação (cria as transações reais)",
        description:
          "⚠️ Não é transacional: cria N transações em loop e só depois marca CONFIRMED. Uma falha no meio deixa o import em READY_FOR_REVIEW com transações já criadas; um novo confirm estoura a unique de extractedTransactionId (dívida mapeada).",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": {
            description: "Importação confirmada e transações criadas.",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ConfirmStatementImportResponse" } },
            },
          },
          "400": {
            description:
              "Importação já confirmada, ou há transações extraídas sem categoria (obrigatória para confirmar).",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
  },
};
