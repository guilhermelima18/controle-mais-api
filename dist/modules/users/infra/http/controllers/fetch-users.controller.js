"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FetchUsersController = void 0;
const fetch_users_1 = require("../../../use-cases/fetch-users");
const prisma_users_repository_1 = require("../../../repositories/prisma/prisma-users-repository");
class FetchUsersController {
    async handle(request, reply) {
        const usersRepository = new prisma_users_repository_1.PrismaUsersRepository();
        const fetchUsersUseCase = new fetch_users_1.FetchUsersUseCase(usersRepository);
        const users = await fetchUsersUseCase.execute();
        const usersList = users.map((user) => ({
            id: user.id,
            name: user.name,
            cpf: user.cpf,
            email: user.email,
        }));
        return reply.code(200).send(usersList);
    }
}
exports.FetchUsersController = FetchUsersController;
