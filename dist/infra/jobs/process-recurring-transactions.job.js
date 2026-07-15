"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const process_recurring_transactions_1 = require("./process-recurring-transactions");
(0, process_recurring_transactions_1.runProcessRecurringTransactionsJob)()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error("[process-recurring-transactions] Falha na execução:", error);
    process.exit(1);
});
