import { FastifyReply, FastifyRequest } from "fastify";
import { UsersListService } from "../../services/users/users-list.service";

export class UsersListController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    try {
      const usersService = new UsersListService();
      const users = await usersService.execute();

      const usersList = users.map((user) => ({
        id: user?.id,
        name: user?.name,
        cpf: user?.cpf,
        email: user?.email,
      }));

      return reply.code(200).send(usersList);
    } catch (error: any) {
      return reply.status(500).send({ error: "Erro interno do servidor." });
    }
  }
}
