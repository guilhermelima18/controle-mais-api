"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FetchUserController = void 0;
const fetch_user_by_id_1 = require("../../../use-cases/fetch-user-by-id");
const prisma_users_repository_1 = require("../../../repositories/prisma/prisma-users-repository");
class FetchUserController {
    async handle(request, reply) {
        const { id } = request.params;
        const usersRepository = new prisma_users_repository_1.PrismaUsersRepository();
        const fetchUserByIdUseCase = new fetch_user_by_id_1.FetchUserByIdUseCase(usersRepository);
        const user = await fetchUserByIdUseCase.execute({ userId: id });
        return reply.code(200).send({
            id: user.id,
            name: user.name,
            cpf: user.cpf,
            email: user.email,
        });
    }
}
exports.FetchUserController = FetchUserController;
