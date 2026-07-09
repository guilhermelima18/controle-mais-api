"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateRecurringTransactionUseCase = void 0;
const category_not_found_error_1 = require("./errors/category-not-found-error");
const invalid_end_date_error_1 = require("./errors/invalid-end-date-error");
class CreateRecurringTransactionUseCase {
    constructor(recurringTransactionsRepository, categoriesRepository) {
        this.recurringTransactionsRepository = recurringTransactionsRepository;
        this.categoriesRepository = categoriesRepository;
    }
    async execute(data) {
        const category = await this.categoriesRepository.findById(data.categoryId);
        if (!category) {
            throw new category_not_found_error_1.CategoryNotFoundError();
        }
        if (data.endDate && new Date(data.endDate) <= new Date(data.startDate)) {
            throw new invalid_end_date_error_1.InvalidEndDateError();
        }
        return this.recurringTransactionsRepository.create(data);
    }
}
exports.CreateRecurringTransactionUseCase = CreateRecurringTransactionUseCase;
