"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaUsersRepository = void 0;
const prisma_1 = require("../../../../infra/database/prisma");
const user_1 = require("../../entities/user");
class PrismaUsersRepository {
    async create(data) {
        const user = await prisma_1.prisma.user.create({ data });
        return new user_1.User(user);
    }
    async findByCpf(cpf) {
        const user = await prisma_1.prisma.user.findUnique({ where: { cpf } });
        return user ? new user_1.User(user) : null;
    }
    async findById(id) {
        const user = await prisma_1.prisma.user.findUnique({ where: { id } });
        return user ? new user_1.User(user) : null;
    }
    async findMany() {
        const users = await prisma_1.prisma.user.findMany();
        return users.map((user) => new user_1.User(user));
    }
}
exports.PrismaUsersRepository = PrismaUsersRepository;
