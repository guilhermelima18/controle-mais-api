"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateRecurringTransactionController = void 0;
const update_recurring_transaction_dto_1 = require("../../../dtos/update-recurring-transaction.dto");
const update_recurring_transaction_1 = require("../../../use-cases/update-recurring-transaction");
const prisma_recurring_transactions_repository_1 = require("../../../repositories/prisma/prisma-recurring-transactions-repository");
const prisma_categories_repository_1 = require("../../../../categories/repositories/prisma/prisma-categories-repository");
class UpdateRecurringTransactionController {
    async handle(request, reply) {
        const { id: recurringTransactionId } = request.params;
        const { success, data, error } = update_recurring_transaction_dto_1.updateRecurringTransactionSchema.safeParse(request.body);
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
        const updateRecurringTransactionUseCase = new update_recurring_transaction_1.UpdateRecurringTransactionUseCase(recurringTransactionsRepository, categoriesRepository);
        await updateRecurringTransactionUseCase.execute({
            recurringTransactionId,
            userId: request.user.sub,
            data: {
                description: data.description,
                amount: data.amount,
                type: data.type,
                frequency: data.frequency,
                startDate: data.startDate,
                endDate: data.endDate,
                categoryId: data.categoryId,
            },
        });
        return reply
            .code(200)
            .send({ success: true, message: "Recorrência atualizada com sucesso!" });
    }
}
exports.UpdateRecurringTransactionController = UpdateRecurringTransactionController;
