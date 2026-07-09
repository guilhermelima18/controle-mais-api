"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTransactionParamsSchema = void 0;
const zod_1 = require("zod");
exports.deleteTransactionParamsSchema = zod_1.z.object({
    id: zod_1.z.string("O campo id é obrigatório!"),
});
