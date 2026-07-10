import { runProcessRecurringTransactionsJob } from "./process-recurring-transactions";

runProcessRecurringTransactionsJob()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[process-recurring-transactions] Falha na execução:", error);
    process.exit(1);
  });
