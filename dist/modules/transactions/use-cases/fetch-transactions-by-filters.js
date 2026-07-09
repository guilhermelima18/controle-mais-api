"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FetchTransactionsByFiltersUseCase = void 0;
class FetchTransactionsByFiltersUseCase {
    constructor(transactionsRepository) {
        this.transactionsRepository = transactionsRepository;
    }
    async execute({ type, categoryId, search, initialDate, finalDate, userId, page = 1, perPage = 3, }) {
        const transactionType = type === "EXPENSE"
            ? "EXPENSE"
            : type === "INCOME"
                ? "INCOME"
                : undefined;
        const dateFrom = initialDate ? new Date(initialDate) : undefined;
        if (dateFrom)
            dateFrom.setUTCHours(0, 0, 0, 0);
        const dateTo = finalDate ? new Date(finalDate) : undefined;
        if (dateTo)
            dateTo.setUTCHours(23, 59, 59, 999);
        return this.transactionsRepository.findManyByFilters({
            userId,
            type: transactionType,
            categoryId,
            search,
            dateFrom,
            dateTo,
            page,
            perPage,
        });
    }
}
exports.FetchTransactionsByFiltersUseCase = FetchTransactionsByFiltersUseCase;
