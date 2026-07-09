"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FetchRecurringTransactionsController = void 0;
const fetch_recurring_transactions_1 = require("../../../use-cases/fetch-recurring-transactions");
const prisma_recurring_transactions_repository_1 = require("../../../repositories/prisma/prisma-recurring-transactions-repository");
class FetchRecurringTransactionsController {
    async handle(request, reply) {
        const recurringTransactionsRepository = new prisma_recurring_transactions_repository_1.PrismaRecurringTransactionsRepository();
        const fetchRecurringTransactionsUseCase = new fetch_recurring_transactions_1.FetchRecurringTransactionsUseCase(recurringTransactionsRepository);
        const recurringTransactions = await fetchRecurringTransactionsUseCase.execute({
            userId: request.user.sub,
        });
        return reply.code(200).send({ data: recurringTransactions });
    }
}
exports.FetchRecurringTransactionsController = FetchRecurringTransactionsController;
