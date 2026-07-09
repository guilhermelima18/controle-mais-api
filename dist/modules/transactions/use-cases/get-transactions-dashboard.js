"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionsDashboardUseCase = void 0;
const date_fns_1 = require("date-fns");
class GetTransactionsDashboardUseCase {
    constructor(transactionsRepository) {
        this.transactionsRepository = transactionsRepository;
    }
    async execute({ userId }) {
        const now = new Date();
        const startOfCurrentMonth = (0, date_fns_1.startOfMonth)(now);
        const startOfNextMonth = (0, date_fns_1.startOfMonth)((0, date_fns_1.addMonths)(now, 1));
        const transactions = await this.transactionsRepository.findManyForDashboard(userId, startOfCurrentMonth, startOfNextMonth);
        const totals = transactions.reduce((acc, t) => {
            const amount = Number(t.amount);
            if (t.type === "INCOME")
                acc.income += amount;
            else
                acc.expense += amount;
            return acc;
        }, { income: 0, expense: 0 });
        const categoriesGroup = transactions.reduce((acc, t) => {
            const type = t.type.toLowerCase();
            if (!acc[type])
                acc[type] = {};
            const categoryName = t.category.name;
            acc[type][categoryName] =
                (acc[type][categoryName] || 0) + Number(t.amount);
            return acc;
        }, { income: {}, expense: {} });
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
    mapCategories(categories, total) {
        return Object.entries(categories).map(([name, value]) => ({
            name,
            value,
            percentage: total > 0 ? Number(((value / total) * 100).toFixed(1)) : 0,
        }));
    }
}
exports.GetTransactionsDashboardUseCase = GetTransactionsDashboardUseCase;
