import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { AuthController } from "@/controllers/auth";

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/", (request: FastifyRequest, reply: FastifyReply) => {
    const authController = new AuthController();
    return authController.handle(request, reply);
  });
}
