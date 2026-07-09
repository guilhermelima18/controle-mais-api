"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateSchema = void 0;
const zod_1 = require("zod");
exports.authenticateSchema = zod_1.z.object({
    cpf: zod_1.z.string("O campo CPF é obrigatório!"),
    password: zod_1.z
        .string("O campo senha é obrigatório!")
        .min(6, "A senha deve ter no mínimo 6 caracteres"),
});
