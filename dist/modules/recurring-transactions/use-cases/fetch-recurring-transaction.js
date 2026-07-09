"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FetchRecurringTransactionUseCase = void 0;
const resource_not_found_error_1 = require("../../../core/errors/resource-not-found-error");
class FetchRecurringTransactionUseCase {
    constructor(recurringTransactionsRepository) {
        this.recurringTransactionsRepository = recurringTransactionsRepository;
    }
    async execute({ recurringTransactionId, userId, }) {
        const recurringTransaction = await this.recurringTransactionsRepository.findByIdAndUser(recurringTransactionId, userId);
        if (!recurringTransaction) {
            throw new resource_not_found_error_1.ResourceNotFoundError("Essa recorrência não existe!");
        }
        return recurringTransaction;
    }
}
exports.FetchRecurringTransactionUseCase = FetchRecurringTransactionUseCase;
