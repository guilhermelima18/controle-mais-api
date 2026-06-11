import { startOfMonth, addMonths } from "date-fns";
import { prisma } from "../../libs/prisma";

export class TransactionsListDashboardService {
  async execute({
    user,
  }: {
    user: {
      sub: string;
    };
  }) {
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const startOfNextMonth = startOfMonth(addMonths(now, 1));

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.sub,
        date: {
          gte: startOfCurrentMonth,
          lt: startOfNextMonth,
        },
      },
      include: { category: true },
    });

    const totals = transactions.reduce(
      (acc, t) => {
        const amount = Number(t.amount);
        if (t.type === "INCOME") acc.income += amount;
        else acc.expense += amount;
        return acc;
      },
      { income: 0, expense: 0 },
    );

    const categoriesGroup = transactions.reduce(
      (acc, t) => {
        const type = t.type.toLowerCase();

        if (!acc[type]) acc[type] = {};

        acc[type][t.category.name] =
          (acc[type][t.category.name] || 0) + Number(t.amount);

        return acc;
      },
      { income: {}, expense: {} } as any,
    );

    return {
      total: totals.income - totals.expense,
      income: totals.income,
      expense: totals.expense,
      perType: {
        income: this.mapCategories(categoriesGroup.income, totals.income),
        expense: this.mapCategories(categoriesGroup.expense, totals.expense),
      },
    };
  }

  private mapCategories(categories: Record<string, number>, total: number) {
    return Object.entries(categories).map(([name, value]) => ({
      name,
      value,
      percentage: total > 0 ? Number(((value / total) * 100).toFixed(1)) : 0,
    }));
  }
}
