import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { UserCreateController } from "@/controllers/users/user-create.controller";

export async function userCreateRoute(fastify: FastifyInstance) {
  fastify.post(
    "/",
    {
      onRequest: [fastify.authenticate],
    },
    (request: FastifyRequest, reply: FastifyReply) => {
      const usersController = new UserCreateController();
      return usersController.handle(request, reply);
    },
  );
}
