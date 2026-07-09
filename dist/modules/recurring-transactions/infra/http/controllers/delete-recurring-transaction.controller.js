"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteRecurringTransactionController = void 0;
const delete_recurring_transaction_1 = require("../../../use-cases/delete-recurring-transaction");
const prisma_recurring_transactions_repository_1 = require("../../../repositories/prisma/prisma-recurring-transactions-repository");
class DeleteRecurringTransactionController {
    async handle(request, reply) {
        const { id: recurringTransactionId } = request.params;
        const recurringTransactionsRepository = new prisma_recurring_transactions_repository_1.PrismaRecurringTransactionsRepository();
        const deleteRecurringTransactionUseCase = new delete_recurring_transaction_1.DeleteRecurringTransactionUseCase(recurringTransactionsRepository);
        await deleteRecurringTransactionUseCase.execute({
            recurringTransactionId,
            userId: request.user.sub,
        });
        return reply
            .code(200)
            .send({ success: true, message: "Recorrência removida com sucesso!" });
    }
}
exports.DeleteRecurringTransactionController = DeleteRecurringTransactionController;
