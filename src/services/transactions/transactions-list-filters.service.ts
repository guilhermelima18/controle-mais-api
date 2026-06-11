import { prisma } from "@/libs/prisma";

export class TransactionsListFiltersService {
  async execute({
    type,
    categoryId,
    search,
    initialDate,
    finalDate,
    user,
  }: {
    type?: string;
    categoryId?: string;
    search?: string;
    initialDate?: string;
    finalDate?: string;
    user: {
      sub: string;
    };
  }) {
    const transactionType =
      type === "EXPENSE" ? "EXPENSE" : type === "INCOME" ? "INCOME" : undefined;

    const gteDate = initialDate ? new Date(initialDate) : undefined;
    if (gteDate) gteDate.setUTCHours(0, 0, 0, 0);

    const lteDate = finalDate ? new Date(finalDate) : undefined;
    if (lteDate) lteDate.setUTCHours(23, 59, 59, 999);

    return await prisma.transaction.findMany({
      where: {
        userId: user?.sub,
        type: transactionType,
        categoryId,
        date: {
          gte: gteDate,
          lte: lteDate,
        },
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
}
