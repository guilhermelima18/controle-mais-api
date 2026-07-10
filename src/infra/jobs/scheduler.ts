import cron from "node-cron";
import { env } from "../../config/env";
import { runProcessRecurringTransactionsJob } from "./process-recurring-transactions";

export function startScheduledJobs() {
  cron.schedule(env.recurringTransactionsCronExpression, () => {
    runProcessRecurringTransactionsJob().catch((error) => {
      console.error(
        "[process-recurring-transactions] Falha na execução agendada:",
        error,
      );
    });
  });

  console.log(
    `[scheduler] Job de recorrências agendado com a expressão "${env.recurringTransactionsCronExpression}".`,
  );
}
