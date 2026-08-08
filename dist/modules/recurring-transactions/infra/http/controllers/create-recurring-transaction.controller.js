"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateRecurringTransactionController = void 0;
const create_recurring_transaction_dto_1 = require("../../../dtos/create-recurring-transaction.dto");
const create_recurring_transaction_1 = require("../../../use-cases/create-recurring-transaction");
const prisma_recurring_transactions_repository_1 = require("../../../repositories/prisma/prisma-recurring-transactions-repository");
const prisma_categories_repository_1 = require("../../../../categories/repositories/prisma/prisma-categories-repository");
class CreateRecurringTransactionController {
    async handle(request, reply) {
        const { success, data, error } = create_recurring_transaction_dto_1.createRecurringTransactionSchema.safeParse(request.body);
        if (!success) {
            return reply.code(400).send({
                errors: error.issues.map((issue) => ({
                    campo: issue.path[0],
                    message: issue.message,
                })),
            });
        }
        const recurringTransactionsRepository = new prisma_recurring_transactions_repository_1.PrismaRecurringTransactionsRepository();
        const categoriesRepository = new prisma_categories_repository_1.PrismaCategoriesRepository();
        const createRecurringTransactionUseCase = new create_recurring_transaction_1.CreateRecurringTransactionUseCase(recurringTransactionsRepository, categoriesRepository);
        const { recurringTransaction, createdTransactions } = await createRecurringTransactionUseCase.execute({
            description: data.description,
            amount: data.amount,
            type: data.type,
            frequency: data.frequency,
            startDate: data.startDate,
            endDate: data.endDate,
            userId: request.user.sub,
            categoryId: data.categoryId,
        });
        return reply.code(201).send({
            success: true,
            message: "Recorrência criada com sucesso!",
            recurringTransaction,
            createdTransactions,
        });
    }
}
exports.CreateRecurringTransactionController = CreateRecurringTransactionController;
