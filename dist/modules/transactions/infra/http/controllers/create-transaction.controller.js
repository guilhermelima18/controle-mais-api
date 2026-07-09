"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTransactionController = void 0;
const create_transaction_dto_1 = require("../../../dtos/create-transaction.dto");
const create_transaction_1 = require("../../../use-cases/create-transaction");
const prisma_transactions_repository_1 = require("../../../repositories/prisma/prisma-transactions-repository");
class CreateTransactionController {
    async handle(request, reply) {
        const { success, data, error } = create_transaction_dto_1.createTransactionSchema.safeParse(request.body);
        if (!success) {
            return reply.code(400).send({
                errors: error.issues.map((issue) => ({
                    campo: issue.path[0],
                    message: issue.message,
                })),
            });
        }
        const transactionsRepository = new prisma_transactions_repository_1.PrismaTransactionsRepository();
        const createTransactionUseCase = new create_transaction_1.CreateTransactionUseCase(transactionsRepository);
        await createTransactionUseCase.execute({
            description: data.description,
            amount: data.amount,
            type: data.type,
            date: data.date,
            userId: request.user.sub,
            categoryId: data.categoryId,
        });
        return reply
            .code(201)
            .send({ success: true, message: "Transação criada com sucesso!" });
    }
}
exports.CreateTransactionController = CreateTransactionController;
