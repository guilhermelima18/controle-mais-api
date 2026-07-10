import "dotenv/config";

export const env = {
  port: Number(process.env.PORT) || 3333,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET ?? "super-secret-key",
  recurringTransactionsCronExpression:
    process.env.RECURRING_TRANSACTIONS_CRON_EXPRESSION ?? "*/15 * * * *",
};
