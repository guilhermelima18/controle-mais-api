"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateUserController = void 0;
const create_user_dto_1 = require("../../../dtos/create-user.dto");
const create_user_1 = require("../../../use-cases/create-user");
const prisma_users_repository_1 = require("../../../repositories/prisma/prisma-users-repository");
class CreateUserController {
    async handle(request, reply) {
        console.log(request.body);
        const { success, data, error } = create_user_dto_1.createUserSchema.safeParse(request.body);
        if (!success) {
            return reply.code(400).send({
                errors: error.issues.map((issue) => ({
                    campo: issue.path[0],
                    message: issue.message,
                })),
            });
        }
        const usersRepository = new prisma_users_repository_1.PrismaUsersRepository();
        const createUserUseCase = new create_user_1.CreateUserUseCase(usersRepository);
        await createUserUseCase.execute({
            name: data.name,
            cpf: data.cpf,
            email: data.email,
            password: data.password,
        });
        return reply
            .code(201)
            .send({ success: true, message: "Usuário criado com sucesso!" });
    }
}
exports.CreateUserController = CreateUserController;
