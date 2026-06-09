import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { CategoriesListController } from "@/controllers/categories/categories-list.controller";

export async function categoriesListRoute(fastify: FastifyInstance) {
  fastify.get(
    "/",
    {
      onRequest: [fastify.authenticate],
    },
    (request: FastifyRequest, reply: FastifyReply) => {
      const categoriesController = new CategoriesListController();
      return categoriesController.handle(request, reply);
    },
  );
}
