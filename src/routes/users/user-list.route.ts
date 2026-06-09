import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { UserListController } from "@/controllers/users/user-list.controller";

export async function userListRoute(fastify: FastifyInstance) {
  fastify.get(
    "/:id",
    {
      onRequest: [fastify.authenticate],
    },
    (request: FastifyRequest, reply: FastifyReply) => {
      const usersController = new UserListController();
      return usersController.handle(request, reply);
    },
  );
}
