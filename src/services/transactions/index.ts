import { prisma } from "../../libs/prisma";

type TransactionCreate = {
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  date: string;
  userId: string;
  categoryId: string;
};

export class TransactionsService {
  async listByFilters({
    type,
    categoryId,
    search,
    user,
  }: {
    type?: string;
    categoryId?: string;
    search?: string;
    user: {
      sub: string;
    };
  }) {
    return await prisma.transaction.findMany({
      where: {
        userId: user?.sub,
        type:
          type === "EXPENSE"
            ? "EXPENSE"
            : type === "INCOME"
              ? "INCOME"
              : undefined,
        categoryId,
        OR: search
          ? [{ description: { contains: search, mode: "insensitive" } }]
          : undefined,
      },
      include: {
        category: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async create({
    description,
    amount,
    type,
    date,
    userId,
    categoryId,
  }: TransactionCreate) {
    return await prisma.transaction.create({
      data: {
        description,
        amount,
        type,
        date,
        userId,
        categoryId,
      },
    });
  }
}
