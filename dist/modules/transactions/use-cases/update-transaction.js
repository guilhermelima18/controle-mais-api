"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTransactionUseCase = void 0;
const resource_not_found_error_1 = require("../../../core/errors/resource-not-found-error");
class UpdateTransactionUseCase {
    constructor(transactionsRepository) {
        this.transactionsRepository = transactionsRepository;
    }
    async execute({ transactionId, userId, ...data }) {
        const transaction = await this.transactionsRepository.findByIdAndUser(transactionId, userId);
        if (!transaction) {
            throw new resource_not_found_error_1.ResourceNotFoundError("Essa transação não existe!");
        }
        return this.transactionsRepository.update(transactionId, data);
    }
}
exports.UpdateTransactionUseCase = UpdateTransactionUseCase;
