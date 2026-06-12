import { prisma } from "../../libs/prisma";

export class TransactionsListFiltersService {
  async execute({
    type,
    categoryId,
    search,
    initialDate,
    finalDate,
    user,
    page = 1,
    perPage = 3,
  }: {
    type?: string;
    categoryId?: string;
    search?: string;
    initialDate?: string;
    finalDate?: string;
    user: {
      sub: string;
    };
    page?: number;
    perPage?: number;
  }) {
    const transactionType =
      type === "EXPENSE"
        ? ("EXPENSE" as const)
        : type === "INCOME"
          ? ("INCOME" as const)
          : undefined;

    const gteDate = initialDate ? new Date(initialDate) : undefined;
    if (gteDate) gteDate.setUTCHours(0, 0, 0, 0);

    const lteDate = finalDate ? new Date(finalDate) : undefined;
    if (lteDate) lteDate.setUTCHours(23, 59, 59, 999);

    const whereClause = {
      userId: user?.sub,
      type: transactionType,
      categoryId,
      date: {
        gte: gteDate,
        lte: lteDate,
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
      data: transactions,
      meta: {
        totalItems,
        currentPage: page,
        totalPages,
        itemsPerPage: perPage,
      },
    };
  }
}
