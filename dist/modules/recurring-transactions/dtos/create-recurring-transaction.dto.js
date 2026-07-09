"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRecurringTransactionSchema = void 0;
const zod_1 = require("zod");
exports.createRecurringTransactionSchema = zod_1.z.object({
    description: zod_1.z.string("O campo descrição é obrigatório!"),
    amount: zod_1.z.number("O campo valor é obrigatório!").positive("O valor deve ser maior que zero!"),
    type: zod_1.z.enum(["INCOME", "EXPENSE"], "O campo tipo é obrigatório!"),
    frequency: zod_1.z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"], "O campo frequência é obrigatório!"),
    startDate: zod_1.z.string("O campo data de início é obrigatório!"),
    endDate: zod_1.z.string().optional(),
    categoryId: zod_1.z.string("O campo categoria é obrigatório!"),
});
