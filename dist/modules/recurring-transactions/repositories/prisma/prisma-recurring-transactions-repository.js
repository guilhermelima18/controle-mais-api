"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaRecurringTransactionsRepository = void 0;
const prisma_1 = require("../../../../infra/database/prisma");
const recurring_transaction_1 = require("../../entities/recurring-transaction");
const transaction_1 = require("../../../transactions/entities/transaction");
class PrismaRecurringTransactionsRepository {
    async create(data) {
        const recurringTransaction = await prisma_1.prisma.recurringTransaction.create({
            data: {
                ...data,
                startDate: new Date(data.startDate),
                endDate: data.endDate ? new Date(data.endDate) : data.endDate,
            },
        });
        return new recurring_transaction_1.RecurringTransaction(recurringTransaction);
    }
    async createWithDueTransactions(data, dueCycles) {
        return prisma_1.prisma.$transaction(async (tx) => {
            const recurringTransaction = await tx.recurringTransaction.create({
                data: {
                    ...data,
                    startDate: new Date(data.startDate),
                    endDate: data.endDate ? new Date(data.endDate) : data.endDate,
                },
            });
            const createdTransactions = [];
            for (const cycleDate of dueCycles) {
                // Este mapeamento recorrência -> transação DEVE permanecer idêntico ao do
                // ProcessRecurringTransactionsUseCase: o FR-002/FR-012 da 003 exigem que um
                // lançamento gerado aqui seja indistinguível de um gerado pelo job.
                const transaction = await tx.transaction.create({
                    data: {
                        description: recurringTransaction.description,
                        amount: recurringTransaction.amount,
                        type: recurringTransaction.type,
                        date: cycleDate,
                        userId: recurringTransaction.userId,
                        categoryId: recurringTransaction.categoryId,
                        recurringTransactionId: recurringTransaction.id,
                    },
                });
                createdTransactions.push(new transaction_1.Transaction(transaction));
            }
            if (dueCycles.length === 0) {
                return {
                    recurringTransaction: new recurring_transaction_1.RecurringTransaction(recurringTransaction),
                    createdTransactions,
                };
            }
            const updated = await tx.recurringTransaction.update({
                where: { id: recurringTransaction.id },
                data: { lastGeneratedDate: dueCycles[dueCycles.length - 1] },
            });
            return {
                recurringTransaction: new recurring_transaction_1.RecurringTransaction(updated),
                createdTransactions,
            };
        });
    }
    async update(recurringTransactionId, data) {
        const recurringTransaction = await prisma_1.prisma.recurringTransaction.update({
            where: { id: recurringTransactionId },
            data: {
                ...data,
                startDate: data.startDate ? new Date(data.startDate) : undefined,
                endDate: data.endDate ? new Date(data.endDate) : data.endDate,
            },
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
