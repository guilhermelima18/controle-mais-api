"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FetchTransactionController = void 0;
const fetch_transaction_1 = require("../../../use-cases/fetch-transaction");
const prisma_transactions_repository_1 = require("../../../repositories/prisma/prisma-transactions-repository");
class FetchTransactionController {
    async handle(request, reply) {
        const { id: transactionId } = request.params;
        const transactionsRepository = new prisma_transactions_repository_1.PrismaTransactionsRepository();
        const fetchTransactionUseCase = new fetch_transaction_1.FetchTransactionUseCase(transactionsRepository);
        const transaction = await fetchTransactionUseCase.execute({
            transactionId,
            userId: request.user.sub,
        });
        return reply.code(200).send(transaction);
    }
}
exports.FetchTransactionController = FetchTransactionController;
