"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaTransactionsRepository = void 0;
const prisma_1 = require("../../../../infra/database/prisma");
const transaction_1 = require("../../entities/transaction");
class PrismaTransactionsRepository {
    async create(data) {
        const transaction = await prisma_1.prisma.transaction.create({ data });
        return new transaction_1.Transaction(transaction);
    }
    async update(transactionId, data) {
        const transaction = await prisma_1.prisma.transaction.update({
            where: { id: transactionId },
            data,
        });
        return new transaction_1.Transaction(transaction);
    }
    async delete(transactionId) {
        await prisma_1.prisma.transaction.delete({ where: { id: transactionId } });
    }
    async findById(transactionId) {
        const transaction = await prisma_1.prisma.transaction.findUnique({
            where: { id: transactionId },
        });
        return transaction ? new transaction_1.Transaction(transaction) : null;
    }
    async findByIdAndUser(transactionId, userId) {
        const transaction = await prisma_1.prisma.transaction.findUnique({
            where: { id: transactionId, userId },
            include: { category: true },
        });
        return transaction ? new transaction_1.Transaction(transaction) : null;
    }
    async findManyByFilters({ userId, type, categoryId, search, dateFrom, dateTo, page, perPage, }) {
        const whereClause = {
            userId,
            type,
            categoryId,
            date: {
                gte: dateFrom,
                lte: dateTo,
            },
            OR: search
                ? [
                    {
                        description: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                ]
                : undefined,
        };
        const [transactions, totalItems] = await prisma_1.prisma.$transaction([
            prisma_1.prisma.transaction.findMany({
                where: whereClause,
                include: {
                    category: true,
                },
                orderBy: {
                    date: "desc",
                },
                skip: (page - 1) * perPage,
                take: perPage,
            }),
            prisma_1.prisma.transaction.count({
                where: whereClause,
            }),
        ]);
        const totalPages = Math.ceil(totalItems / perPage);
        return {
            data: transactions.map((transaction) => new transaction_1.Transaction(transaction)),
            meta: {
                totalItems,
                currentPage: page,
                totalPages,
                itemsPerPage: perPage,
            },
        };
    }
    async findManyForDashboard(userId, startDate, endDate) {
        const transactions = await prisma_1.prisma.transaction.findMany({
            where: {
                userId,
                date: {
                    gte: startDate,
                    lt: endDate,
                },
            },
            include: { category: true },
        });
        return transactions.map((transaction) => new transaction_1.Transaction(transaction));
    }
}
exports.PrismaTransactionsRepository = PrismaTransactionsRepository;
