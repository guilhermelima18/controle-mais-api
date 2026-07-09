"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRecurringTransactionSchema = void 0;
const zod_1 = require("zod");
exports.updateRecurringTransactionSchema = zod_1.z.object({
    description: zod_1.z.string().optional(),
    amount: zod_1.z.number().positive("O valor deve ser maior que zero!").optional(),
    type: zod_1.z.enum(["INCOME", "EXPENSE"]).optional(),
    frequency: zod_1.z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).optional(),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    categoryId: zod_1.z.string().optional(),
});
