"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTransactionSchema = void 0;
const zod_1 = require("zod");
exports.createTransactionSchema = zod_1.z.object({
    description: zod_1.z.string("O campo descrição é obrigatório!"),
    amount: zod_1.z.number("O campo valor é obrigatório!"),
    type: zod_1.z.string("O campo tipo é obrigatório!"),
    date: zod_1.z.string("O campo data é obrigatório"),
    categoryId: zod_1.z.string("O campo categoria é obrigatório!"),
});
