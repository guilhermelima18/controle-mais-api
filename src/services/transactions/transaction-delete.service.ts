import { prisma } from "../../libs/prisma";

export class TransactionDeleteService {
  async execute({ transactionId }: { transactionId: string }) {
    const transaction = await prisma.transaction.findUnique({
      where: {
        id: transactionId,
      },
    });

    if (!transaction) {
      throw new Error("Essa transação não existe!");
    }

    return await prisma.transaction.delete({
      where: {
        id: transactionId,
      },
    });
  }
}
