import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { UsersListController } from "@/controllers/users/users-list.controller";

export async function usersListRoute(fastify: FastifyInstance) {
  fastify.get(
    "/",
    {
      onRequest: [fastify.authenticate],
    },
    (request: FastifyRequest, reply: FastifyReply) => {
      const usersController = new UsersListController();
      return usersController.handle(request, reply);
    },
  );
}
