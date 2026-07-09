"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTransactionController = void 0;
const update_transaction_dto_1 = require("../../../dtos/update-transaction.dto");
const update_transaction_1 = require("../../../use-cases/update-transaction");
const prisma_transactions_repository_1 = require("../../../repositories/prisma/prisma-transactions-repository");
class UpdateTransactionController {
    async handle(request, reply) {
        const { id: transactionId } = request.params;
        const { success, data, error } = update_transaction_dto_1.updateTransactionSchema.safeParse(request.body);
        if (!success) {
            return reply.code(400).send({
                errors: error.issues.map((issue) => ({
                    campo: issue.path[0],
                    message: issue.message,
                })),
            });
        }
        const transactionsRepository = new prisma_transactions_repository_1.PrismaTransactionsRepository();
        const updateTransactionUseCase = new update_transaction_1.UpdateTransactionUseCase(transactionsRepository);
        await updateTransactionUseCase.execute({
            transactionId,
            userId: request.user.sub,
            description: data.description,
            amount: data.amount,
            type: data.type,
            date: data.date,
            categoryId: data.categoryId,
        });
        return reply
            .code(201)
            .send({ success: true, message: "Transação atualizada com sucesso!" });
    }
}
exports.UpdateTransactionController = UpdateTransactionController;
