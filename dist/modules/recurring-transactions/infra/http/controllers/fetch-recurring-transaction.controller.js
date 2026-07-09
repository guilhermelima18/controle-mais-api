"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FetchRecurringTransactionController = void 0;
const fetch_recurring_transaction_1 = require("../../../use-cases/fetch-recurring-transaction");
const prisma_recurring_transactions_repository_1 = require("../../../repositories/prisma/prisma-recurring-transactions-repository");
class FetchRecurringTransactionController {
    async handle(request, reply) {
        const { id: recurringTransactionId } = request.params;
        const recurringTransactionsRepository = new prisma_recurring_transactions_repository_1.PrismaRecurringTransactionsRepository();
        const fetchRecurringTransactionUseCase = new fetch_recurring_transaction_1.FetchRecurringTransactionUseCase(recurringTransactionsRepository);
        const recurringTransaction = await fetchRecurringTransactionUseCase.execute({
            recurringTransactionId,
            userId: request.user.sub,
        });
        return reply.code(200).send(recurringTransaction);
    }
}
exports.FetchRecurringTransactionController = FetchRecurringTransactionController;
