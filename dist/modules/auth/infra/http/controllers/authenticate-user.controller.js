"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticateUserController = void 0;
const authenticate_dto_1 = require("../../../dtos/authenticate.dto");
const authenticate_user_1 = require("../../../use-cases/authenticate-user");
const prisma_users_repository_1 = require("../../../../users/repositories/prisma/prisma-users-repository");
class AuthenticateUserController {
    async handle(request, reply) {
        const { success, data, error } = authenticate_dto_1.authenticateSchema.safeParse(request.body);
        if (!success) {
            return reply.code(400).send({
                errors: error.issues.map((issue) => ({
                    campo: issue.path[0],
                    message: issue.message,
                })),
            });
        }
        const usersRepository = new prisma_users_repository_1.PrismaUsersRepository();
        const authenticateUserUseCase = new authenticate_user_1.AuthenticateUserUseCase(usersRepository);
        const userAuth = await authenticateUserUseCase.execute({
            cpf: data.cpf,
            password: data.password,
        });
        const token = await reply.jwtSign({ name: userAuth.name }, {
            sign: {
                sub: userAuth.id,
                expiresIn: "7d",
            },
        });
        return reply.code(200).send({
            user: userAuth,
            token,
        });
    }
}
exports.AuthenticateUserController = AuthenticateUserController;
