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
