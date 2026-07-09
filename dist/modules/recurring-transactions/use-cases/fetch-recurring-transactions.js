"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FetchRecurringTransactionsUseCase = void 0;
class FetchRecurringTransactionsUseCase {
    constructor(recurringTransactionsRepository) {
        this.recurringTransactionsRepository = recurringTransactionsRepository;
    }
    async execute({ userId }) {
        return this.recurringTransactionsRepository.findManyByUser(userId);
    }
}
exports.FetchRecurringTransactionsUseCase = FetchRecurringTransactionsUseCase;
