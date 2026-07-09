"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FetchTransactionsByFiltersController = void 0;
const list_transactions_filters_dto_1 = require("../../../dtos/list-transactions-filters.dto");
const fetch_transactions_by_filters_1 = require("../../../use-cases/fetch-transactions-by-filters");
const prisma_transactions_repository_1 = require("../../../repositories/prisma/prisma-transactions-repository");
class FetchTransactionsByFiltersController {
    async handle(request, reply) {
        const { success, data, error } = list_transactions_filters_dto_1.listTransactionsByFiltersSchema.safeParse(request.query);
        if (!success) {
            return reply.code(400).send({
                errors: error.issues.map((issue) => ({
                    campo: issue.path[0],
                    message: issue.message,
                })),
            });
        }
        const transactionsRepository = new prisma_transactions_repository_1.PrismaTransactionsRepository();
        const fetchTransactionsByFiltersUseCase = new fetch_transactions_by_filters_1.FetchTransactionsByFiltersUseCase(transactionsRepository);
        const transactions = await fetchTransactionsByFiltersUseCase.execute({
            search: data.search,
            categoryId: data.category,
            type: data.type,
            initialDate: data.initialDate,
            finalDate: data.finalDate,
            userId: request.user.sub,
            page: data.page ? Number(data.page) : undefined,
            perPage: data.perPage ? Number(data.perPage) : undefined,
        });
        return reply.code(200).send(transactions);
    }
}
exports.FetchTransactionsByFiltersController = FetchTransactionsByFiltersController;
