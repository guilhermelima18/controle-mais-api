"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTransactionUseCase = void 0;
class CreateTransactionUseCase {
    constructor(transactionsRepository) {
        this.transactionsRepository = transactionsRepository;
    }
    async execute(data) {
        return this.transactionsRepository.create(data);
    }
}
exports.CreateTransactionUseCase = CreateTransactionUseCase;
