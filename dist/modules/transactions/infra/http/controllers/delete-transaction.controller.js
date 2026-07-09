"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteTransactionController = void 0;
const delete_transaction_dto_1 = require("../../../dtos/delete-transaction.dto");
const delete_transaction_1 = require("../../../use-cases/delete-transaction");
const prisma_transactions_repository_1 = require("../../../repositories/prisma/prisma-transactions-repository");
class DeleteTransactionController {
    async handle(request, reply) {
        const { success, data, error } = delete_transaction_dto_1.deleteTransactionParamsSchema.safeParse(request.params);
        if (!success) {
            return reply.code(400).send({
                errors: error.issues.map((issue) => ({
                    campo: issue.path[0],
                    message: issue.message,
                })),
            });
        }
        const transactionsRepository = new prisma_transactions_repository_1.PrismaTransactionsRepository();
        const deleteTransactionUseCase = new delete_transaction_1.DeleteTransactionUseCase(transactionsRepository);
        await deleteTransactionUseCase.execute({
            transactionId: data.id,
            userId: request.user.sub,
        });
        return reply
            .code(201)
            .send({ success: true, message: "Transação excluída com sucesso!" });
    }
}
exports.DeleteTransactionController = DeleteTransactionController;
