import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { CategoryListController } from "../../controllers/categories/category-list.controller";

export async function categoryListRoute(fastify: FastifyInstance) {
  fastify.get(
    "/:id",
    {
      onRequest: [fastify.authenticate],
    },
    (request: FastifyRequest, reply: FastifyReply) => {
      const categoriesController = new CategoryListController();
      return categoriesController.handle(request, reply);
    },
  );
}
