import { FastifyReply, FastifyRequest } from "fastify";
import { FetchUsersUseCase } from "../../../use-cases/fetch-users";
import { PrismaUsersRepository } from "../../../repositories/prisma/prisma-users-repository";

export class FetchUsersController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const usersRepository = new PrismaUsersRepository();
    const fetchUsersUseCase = new FetchUsersUseCase(usersRepository);

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
