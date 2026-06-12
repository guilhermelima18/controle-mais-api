import { prisma } from "../../libs/prisma";

type TransactionUpdate = {
  description?: string;
  amount?: number;
  type?: "INCOME" | "EXPENSE";
  date?: string;
  categoryId?: string;
  userId: string;
  transactionId: string;
};

export class TransactionUpdateService {
  async execute({
    description,
    amount,
    type,
    date,
    categoryId,
    userId,
    transactionId,
  }: TransactionUpdate) {
    return await prisma.transaction.update({
      where: {
        id: transactionId,
      },
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
