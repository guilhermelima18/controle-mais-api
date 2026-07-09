"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessRecurringTransactionsUseCase = void 0;
const calculate_due_cycles_1 = require("./calculate-due-cycles");
class ProcessRecurringTransactionsUseCase {
    constructor(recurringTransactionsRepository, transactionsRepository) {
        this.recurringTransactionsRepository = recurringTransactionsRepository;
        this.transactionsRepository = transactionsRepository;
    }
    async execute(referenceDate = new Date()) {
        const dueRecurringTransactions = await this.recurringTransactionsRepository.findManyDue(referenceDate);
        let generatedTransactionsCount = 0;
        for (const recurringTransaction of dueRecurringTransactions) {
            const cycles = (0, calculate_due_cycles_1.calculateDueCycles)({
                startDate: recurringTransaction.startDate,
                lastGeneratedDate: recurringTransaction.lastGeneratedDate,
                endDate: recurringTransaction.endDate,
                frequency: recurringTransaction.frequency,
                referenceDate,
            });
            if (cycles.length === 0) {
                continue;
            }
            for (const cycleDate of cycles) {
                await this.transactionsRepository.create({
                    description: recurringTransaction.description,
                    amount: Number(recurringTransaction.amount),
                    type: recurringTransaction.type,
                    date: cycleDate.toISOString(),
                    userId: recurringTransaction.userId,
                    categoryId: recurringTransaction.categoryId,
                    recurringTransactionId: recurringTransaction.id,
                });
                generatedTransactionsCount++;
            }
            await this.recurringTransactionsRepository.updateLastGeneratedDate(recurringTransaction.id, cycles[cycles.length - 1]);
        }
        return { generatedTransactionsCount };
    }
}
exports.ProcessRecurringTransactionsUseCase = ProcessRecurringTransactionsUseCase;
