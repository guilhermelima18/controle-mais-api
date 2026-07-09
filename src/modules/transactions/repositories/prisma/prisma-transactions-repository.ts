import { prisma } from "../../../../infra/database/prisma";
import { Transaction } from "../../entities/transaction";
import {
  ITransactionsRepository,
  TransactionCreateData,
  TransactionFiltersQuery,
  TransactionFiltersResult,
  TransactionUpdateData,
} from "../itransactions-repository";

export class PrismaTransactionsRepository implements ITransactionsRepository {
  async create(data: TransactionCreateData): Promise<Transaction> {
    const transaction = await prisma.transaction.create({ data });
    return new Transaction(transaction);
  }

  async update(
    transactionId: string,
    data: TransactionUpdateData,
  ): Promise<Transaction> {
    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data,
    });
    return new Transaction(transaction);
  }

  async delete(transactionId: string): Promise<void> {
    await prisma.transaction.delete({ where: { id: transactionId } });
  }

  async findById(transactionId: string): Promise<Transaction | null> {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });
    return transaction ? new Transaction(transaction) : null;
  }

  async findByIdAndUser(
    transactionId: string,
    userId: string,
  ): Promise<Transaction | null> {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId, userId },
      include: { category: true },
    });
    return transaction ? new Transaction(transaction) : null;
  }

  async findManyByFilters({
    userId,
    type,
    categoryId,
    search,
    dateFrom,
    dateTo,
    page,
    perPage,
  }: TransactionFiltersQuery): Promise<TransactionFiltersResult> {
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
                mode: "insensitive" as const,
              },
            },
          ]
        : undefined,
    };

    const [transactions, totalItems] = await prisma.$transaction([
      prisma.transaction.findMany({
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
      prisma.transaction.count({
        where: whereClause,
      }),
    ]);

    const totalPages = Math.ceil(totalItems / perPage);

    return {
      data: transactions.map((transaction) => new Transaction(transaction)),
      meta: {
        totalItems,
        currentPage: page,
        totalPages,
        itemsPerPage: perPage,
      },
    };
  }

  async findManyForDashboard(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Transaction[]> {
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: { category: true },
    });

    return transactions.map((transaction) => new Transaction(transaction));
  }
}
