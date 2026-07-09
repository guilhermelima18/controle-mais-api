"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteTransactionUseCase = void 0;
const resource_not_found_error_1 = require("../../../core/errors/resource-not-found-error");
class DeleteTransactionUseCase {
    constructor(transactionsRepository) {
        this.transactionsRepository = transactionsRepository;
    }
    async execute({ transactionId, userId, }) {
        const transaction = await this.transactionsRepository.findByIdAndUser(transactionId, userId);
        if (!transaction) {
            throw new resource_not_found_error_1.ResourceNotFoundError("Essa transação não existe!");
        }
        await this.transactionsRepository.delete(transactionId);
    }
}
exports.DeleteTransactionUseCase = DeleteTransactionUseCase;
