import { startOfMonth, addMonths } from "date-fns";
import { ITransactionsRepository } from "../repositories/itransactions-repository";

export class GetTransactionsDashboardUseCase {
  constructor(private transactionsRepository: ITransactionsRepository) {}

  async execute({ userId }: { userId: string }) {
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const startOfNextMonth = startOfMonth(addMonths(now, 1));

    const transactions = await this.transactionsRepository.findManyForDashboard(
      userId,
      startOfCurrentMonth,
      startOfNextMonth,
    );

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

        const categoryName = t.category!.name;
        acc[type][categoryName] =
          (acc[type][categoryName] || 0) + Number(t.amount);

        return acc;
      },
      { income: {}, expense: {} } as Record<string, Record<string, number>>,
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
