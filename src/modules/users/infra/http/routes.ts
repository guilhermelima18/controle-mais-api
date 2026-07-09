import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { CreateUserController } from "./controllers/create-user.controller";
import { FetchUserController } from "./controllers/fetch-user.controller";
import { FetchUsersController } from "./controllers/fetch-users.controller";

export async function usersRoutes(fastify: FastifyInstance) {
  fastify.post("/", (request: FastifyRequest, reply: FastifyReply) => {
    const controller = new CreateUserController();
    return controller.handle(request, reply);
  });

  fastify.get(
    "/",
    { onRequest: [fastify.authenticate] },
    (request: FastifyRequest, reply: FastifyReply) => {
      const controller = new FetchUsersController();
      return controller.handle(request, reply);
    },
  );

  fastify.get(
    "/:id",
    { onRequest: [fastify.authenticate] },
    (request: FastifyRequest, reply: FastifyReply) => {
      const controller = new FetchUserController();
      return controller.handle(request, reply);
    },
  );
}
