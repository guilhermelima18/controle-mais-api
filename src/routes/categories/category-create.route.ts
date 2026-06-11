import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { CategoryCreateController } from "../../controllers/categories/category-create.controller";

export async function categoryCreateRoute(fastify: FastifyInstance) {
  fastify.post(
    "/",
    {
      onRequest: [fastify.authenticate],
    },
    (request: FastifyRequest, reply: FastifyReply) => {
      const categoriesController = new CategoryCreateController();
      return categoriesController.handle(request, reply);
    },
  );
}
