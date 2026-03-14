import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { UsersController } from "../../controllers/users";

export async function usersRoutes(fastify: FastifyInstance) {
  fastify.post("/", (request: FastifyRequest, reply: FastifyReply) => {
    const usersController = new UsersController();
    return usersController.create(request, reply);
  });
}
