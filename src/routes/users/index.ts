import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { UsersController } from "../../controllers/users";

export async function usersRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/",
    {
      onRequest: [fastify.authenticate],
    },
    (request: FastifyRequest, reply: FastifyReply) => {
      const usersController = new UsersController();
      return usersController.list(request, reply);
    },
  );

  fastify.get(
    "/:id",
    {
      onRequest: [fastify.authenticate],
    },
    (request: FastifyRequest, reply: FastifyReply) => {
      const usersController = new UsersController();
      return usersController.listById(request, reply);
    },
  );

  fastify.post("/", (request: FastifyRequest, reply: FastifyReply) => {
    const usersController = new UsersController();
    return usersController.create(request, reply);
  });
}
