import { FastifyReply, FastifyRequest } from "fastify";
import { UserListService } from "@/services/users/user-list.service";

export class UserListController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };

      const usersService = new UserListService();
      const user = await usersService.execute({ userId: id });

      const userList = {
        id: user?.id,
        name: user?.name,
        cpf: user?.cpf,
        email: user?.email,
      };

      return reply.code(200).send(userList);
    } catch (error: any) {
      if (error.message === "Esse usuário não existe!") {
        return reply.status(404).send({ error: error.message });
      }

      return reply.status(500).send({ error: "Erro interno do servidor." });
    }
  }
}
