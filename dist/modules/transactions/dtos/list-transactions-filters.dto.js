"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTransactionsByFiltersSchema = void 0;
const zod_1 = require("zod");
exports.listTransactionsByFiltersSchema = zod_1.z.object({
    search: zod_1.z.string().optional(),
    type: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    initialDate: zod_1.z.string().optional(),
    finalDate: zod_1.z.string().optional(),
    page: zod_1.z.string().optional(),
    perPage: zod_1.z.string().optional(),
});
