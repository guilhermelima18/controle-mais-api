"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCategorySchema = void 0;
const zod_1 = require("zod");
exports.createCategorySchema = zod_1.z.object({
    name: zod_1.z.string("O campo nome é obrigatório!"),
    type: zod_1.z.string("O campo tipo é obrigatório!"),
});
