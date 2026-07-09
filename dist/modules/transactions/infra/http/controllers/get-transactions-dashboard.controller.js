"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionsDashboardController = void 0;
const get_transactions_dashboard_1 = require("../../../use-cases/get-transactions-dashboard");
const prisma_transactions_repository_1 = require("../../../repositories/prisma/prisma-transactions-repository");
class GetTransactionsDashboardController {
    async handle(request, reply) {
        const transactionsRepository = new prisma_transactions_repository_1.PrismaTransactionsRepository();
        const getTransactionsDashboardUseCase = new get_transactions_dashboard_1.GetTransactionsDashboardUseCase(transactionsRepository);
        const dashboard = await getTransactionsDashboardUseCase.execute({
            userId: request.user.sub,
        });
        return reply.code(200).send(dashboard);
    }
}
exports.GetTransactionsDashboardController = GetTransactionsDashboardController;
