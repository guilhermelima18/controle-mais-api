import { prisma } from "@/libs/prisma";

export class TransactionsListFiltersService {
  async execute({
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
    const transactionType =
      type === "EXPENSE" ? "EXPENSE" : type === "INCOME" ? "INCOME" : undefined;

    return await prisma.transaction.findMany({
      where: {
        userId: user?.sub,
        type: transactionType,
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
}
