"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateRecurringTransactionUseCase = void 0;
const category_not_found_error_1 = require("./errors/category-not-found-error");
const invalid_end_date_error_1 = require("./errors/invalid-end-date-error");
const calculate_due_cycles_1 = require("./calculate-due-cycles");
class CreateRecurringTransactionUseCase {
    constructor(recurringTransactionsRepository, categoriesRepository) {
        this.recurringTransactionsRepository = recurringTransactionsRepository;
        this.categoriesRepository = categoriesRepository;
    }
    async execute({ referenceDate = new Date(), ...data }) {
        const category = await this.categoriesRepository.findById(data.categoryId);
        if (!category) {
            throw new category_not_found_error_1.CategoryNotFoundError();
        }
        if (data.endDate && new Date(data.endDate) <= new Date(data.startDate)) {
            throw new invalid_end_date_error_1.InvalidEndDateError();
        }
        // Antecipamos aqui os ciclos que o job geraria na próxima execução, para que o
        // lançamento apareça no extrato na hora (FR-001 da 003). `lastGeneratedDate` é
        // null porque a recorrência ainda não existe — a mesma função usada pelo job
        // decide quais ciclos são devidos, o que garante a paridade exigida pelo FR-002.
        const dueCycles = (0, calculate_due_cycles_1.calculateDueCycles)({
            startDate: new Date(data.startDate),
            lastGeneratedDate: null,
            endDate: data.endDate ? new Date(data.endDate) : null,
            frequency: data.frequency,
            referenceDate,
        });
        return this.recurringTransactionsRepository.createWithDueTransactions(data, dueCycles);
    }
}
exports.CreateRecurringTransactionUseCase = CreateRecurringTransactionUseCase;
