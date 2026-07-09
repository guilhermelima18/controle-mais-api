"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaRecurringTransactionsRepository = void 0;
const prisma_1 = require("../../../../infra/database/prisma");
const recurring_transaction_1 = require("../../entities/recurring-transaction");
class PrismaRecurringTransactionsRepository {
    async create(data) {
        const recurringTransaction = await prisma_1.prisma.recurringTransaction.create({
            data,
        });
        return new recurring_transaction_1.RecurringTransaction(recurringTransaction);
    }
    async update(recurringTransactionId, data) {
        const recurringTransaction = await prisma_1.prisma.recurringTransaction.update({
            where: { id: recurringTransactionId },
            data,
        });
        return new recurring_transaction_1.RecurringTransaction(recurringTransaction);
    }
    async delete(recurringTransactionId) {
        await prisma_1.prisma.recurringTransaction.delete({
            where: { id: recurringTransactionId },
        });
    }
    async findByIdAndUser(recurringTransactionId, userId) {
        const recurringTransaction = await prisma_1.prisma.recurringTransaction.findUnique({
            where: { id: recurringTransactionId, userId },
        });
        return recurringTransaction
            ? new recurring_transaction_1.RecurringTransaction(recurringTransaction)
            : null;
    }
    async findManyByUser(userId) {
        const recurringTransactions = await prisma_1.prisma.recurringTransaction.findMany({
            where: { userId },
        });
        return recurringTransactions.map((recurringTransaction) => new recurring_transaction_1.RecurringTransaction(recurringTransaction));
    }
    async findManyDue(referenceDate) {
        // Não filtramos por endDate aqui: uma recorrência já encerrada pode ainda ter
        // ciclos pendentes de backfill dentro da sua janela válida (FR-014). Quem decide
        // se há algo a gerar é `calculateDueCycles`, não esta query.
        const recurringTransactions = await prisma_1.prisma.recurringTransaction.findMany({
            where: {
                startDate: { lte: referenceDate },
            },
        });
        return recurringTransactions.map((recurringTransaction) => new recurring_transaction_1.RecurringTransaction(recurringTransaction));
    }
    async updateLastGeneratedDate(recurringTransactionId, lastGeneratedDate) {
        await prisma_1.prisma.recurringTransaction.update({
            where: { id: recurringTransactionId },
            data: { lastGeneratedDate },
        });
    }
}
exports.PrismaRecurringTransactionsRepository = PrismaRecurringTransactionsRepository;
