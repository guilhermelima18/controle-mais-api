"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateRecurringTransactionUseCase = void 0;
const resource_not_found_error_1 = require("../../../core/errors/resource-not-found-error");
const category_not_found_error_1 = require("./errors/category-not-found-error");
const invalid_end_date_error_1 = require("./errors/invalid-end-date-error");
class UpdateRecurringTransactionUseCase {
    constructor(recurringTransactionsRepository, categoriesRepository) {
        this.recurringTransactionsRepository = recurringTransactionsRepository;
        this.categoriesRepository = categoriesRepository;
    }
    async execute({ recurringTransactionId, userId, data, }) {
        var _a, _b, _c;
        const recurringTransaction = await this.recurringTransactionsRepository.findByIdAndUser(recurringTransactionId, userId);
        if (!recurringTransaction) {
            throw new resource_not_found_error_1.ResourceNotFoundError("Essa recorrência não existe!");
        }
        if (data.categoryId) {
            const category = await this.categoriesRepository.findById(data.categoryId);
            if (!category) {
                throw new category_not_found_error_1.CategoryNotFoundError();
            }
        }
        const startDate = (_a = data.startDate) !== null && _a !== void 0 ? _a : recurringTransaction.startDate.toISOString();
        const endDate = (_b = data.endDate) !== null && _b !== void 0 ? _b : (_c = recurringTransaction.endDate) === null || _c === void 0 ? void 0 : _c.toISOString();
        if (endDate && new Date(endDate) <= new Date(startDate)) {
            throw new invalid_end_date_error_1.InvalidEndDateError();
        }
        return this.recurringTransactionsRepository.update(recurringTransactionId, data);
    }
}
exports.UpdateRecurringTransactionUseCase = UpdateRecurringTransactionUseCase;
