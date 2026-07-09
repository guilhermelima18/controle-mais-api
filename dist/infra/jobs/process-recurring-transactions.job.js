"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_recurring_transactions_repository_1 = require("../../modules/recurring-transactions/repositories/prisma/prisma-recurring-transactions-repository");
const prisma_transactions_repository_1 = require("../../modules/transactions/repositories/prisma/prisma-transactions-repository");
const process_recurring_transactions_1 = require("../../modules/recurring-transactions/use-cases/process-recurring-transactions");
async function run() {
    const recurringTransactionsRepository = new prisma_recurring_transactions_repository_1.PrismaRecurringTransactionsRepository();
    const transactionsRepository = new prisma_transactions_repository_1.PrismaTransactionsRepository();
    const processRecurringTransactionsUseCase = new process_recurring_transactions_1.ProcessRecurringTransactionsUseCase(recurringTransactionsRepository, transactionsRepository);
    const { generatedTransactionsCount } = await processRecurringTransactionsUseCase.execute();
    console.log(`[process-recurring-transactions] ${generatedTransactionsCount} transação(ões) gerada(s).`);
}
run()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error("[process-recurring-transactions] Falha na execução:", error);
    process.exit(1);
});
