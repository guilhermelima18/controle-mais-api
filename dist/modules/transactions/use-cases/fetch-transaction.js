"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FetchTransactionUseCase = void 0;
class FetchTransactionUseCase {
    constructor(transactionsRepository) {
        this.transactionsRepository = transactionsRepository;
    }
    async execute({ transactionId, userId, }) {
        return this.transactionsRepository.findByIdAndUser(transactionId, userId);
    }
}
exports.FetchTransactionUseCase = FetchTransactionUseCase;
