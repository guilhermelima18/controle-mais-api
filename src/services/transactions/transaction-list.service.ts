import { prisma } from "../../libs/prisma";

export class TransactionListService {
  async execute({
    transactionId,
    user,
  }: {
    transactionId: string;
    user: {
      sub: string;
    };
  }) {
    return await prisma.transaction.findUnique({
      where: {
        id: transactionId,
        userId: user.sub,
      },
      include: {
        category: true,
      },
    });
  }
}
