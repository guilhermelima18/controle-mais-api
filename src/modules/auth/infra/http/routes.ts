import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { AuthenticateUserController } from "./controllers/authenticate-user.controller";

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/", (request: FastifyRequest, reply: FastifyReply) => {
    const controller = new AuthenticateUserController();
    return controller.handle(request, reply);
  });
}
