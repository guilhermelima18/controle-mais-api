"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserSchema = void 0;
const zod_1 = require("zod");
exports.createUserSchema = zod_1.z.object({
    name: zod_1.z.string("O campo nome é obrigatório!"),
    cpf: zod_1.z.string("O campo CPF é obrigatório!"),
    email: zod_1.z.email("E-mail inválido"),
    password: zod_1.z
        .string("O campo senha é obrigatório!")
        .min(6, "A senha deve ter no mínimo 6 caracteres"),
});
