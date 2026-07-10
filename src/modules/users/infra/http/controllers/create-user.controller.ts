import { FastifyReply, FastifyRequest } from "fastify";
import { createUserSchema } from "../../../dtos/create-user.dto";
import { CreateUserUseCase } from "../../../use-cases/create-user";
import { PrismaUsersRepository } from "../../../repositories/prisma/prisma-users-repository";

export class CreateUserController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    console.log(request.body);
    const { success, data, error } = createUserSchema.safeParse(request.body);

    if (!success) {
      return reply.code(400).send({
        errors: error.issues.map((issue) => ({
          campo: issue.path[0],
          message: issue.message,
        })),
      });
    }

    const usersRepository = new PrismaUsersRepository();
    const createUserUseCase = new CreateUserUseCase(usersRepository);

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
