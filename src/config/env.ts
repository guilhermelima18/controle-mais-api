import "dotenv/config";

export const env = {
  port: Number(process.env.PORT) || 3333,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET ?? "super-secret-key",
  recurringTransactionsCronExpression:
    process.env.RECURRING_TRANSACTIONS_CRON_EXPRESSION ?? "*/15 * * * *",
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-5-mini",
  statementImportMaxFileSizeBytes: Number(
    process.env.STATEMENT_IMPORT_MAX_FILE_SIZE_BYTES ?? 10 * 1024 * 1024,
  ),
  useFakeAiProvider: process.env.STATEMENT_IMPORT_USE_FAKE_AI_PROVIDER === "true",
  useDeterministicStatementParserOnly:
    process.env.STATEMENT_IMPORT_USE_DETERMINISTIC_PARSER_ONLY === "true",
};
