import { FastifyReply, FastifyRequest } from "fastify";
import { FetchUserByIdUseCase } from "../../../use-cases/fetch-user-by-id";
import { PrismaUsersRepository } from "../../../repositories/prisma/prisma-users-repository";

export class FetchUserController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    const usersRepository = new PrismaUsersRepository();
    const fetchUserByIdUseCase = new FetchUserByIdUseCase(usersRepository);

    const user = await fetchUserByIdUseCase.execute({ userId: id });

    return reply.code(200).send({
      id: user.id,
      name: user.name,
      cpf: user.cpf,
      email: user.email,
    });
  }
}
