"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTransactionSchema = void 0;
const zod_1 = require("zod");
exports.updateTransactionSchema = zod_1.z.object({
    description: zod_1.z.string().optional(),
    amount: zod_1.z.number().optional(),
    type: zod_1.z.string().optional(),
    date: zod_1.z.string().optional(),
    categoryId: zod_1.z.string().optional(),
});
