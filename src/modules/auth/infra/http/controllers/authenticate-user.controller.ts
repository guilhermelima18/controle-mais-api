import { FastifyReply, FastifyRequest } from "fastify";
import { authenticateSchema } from "../../../dtos/authenticate.dto";
import { AuthenticateUserUseCase } from "../../../use-cases/authenticate-user";
import { PrismaUsersRepository } from "../../../../users/repositories/prisma/prisma-users-repository";

export class AuthenticateUserController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const { success, data, error } = authenticateSchema.safeParse(
      request.body,
    );

    if (!success) {
      return reply.code(400).send({
        errors: error.issues.map((issue) => ({
          campo: issue.path[0],
          message: issue.message,
        })),
      });
    }

    const usersRepository = new PrismaUsersRepository();
    const authenticateUserUseCase = new AuthenticateUserUseCase(
      usersRepository,
    );

    const userAuth = await authenticateUserUseCase.execute({
      cpf: data.cpf,
      password: data.password,
    });

    const token = await reply.jwtSign(
      { name: userAuth.name },
      {
        sign: {
          sub: userAuth.id,
          expiresIn: "7d",
        },
      },
    );

    return reply.code(200).send({
      user: userAuth,
      token,
    });
  }
}
