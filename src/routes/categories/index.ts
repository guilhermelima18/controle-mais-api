import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { CategoriesController } from "../../controllers/categories";

export async function categoriesRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/",
    {
      onRequest: [fastify.authenticate],
    },
    (request: FastifyRequest, reply: FastifyReply) => {
      const categoriesController = new CategoriesController();
      return categoriesController.list(request, reply);
    },
  );

  fastify.get(
    "/:id",
    {
      onRequest: [fastify.authenticate],
    },
    (request: FastifyRequest, reply: FastifyReply) => {
      const categoriesController = new CategoriesController();
      return categoriesController.listById(request, reply);
    },
  );

  fastify.post(
    "/",
    {
      onRequest: [fastify.authenticate],
    },
    (request: FastifyRequest, reply: FastifyReply) => {
      const categoriesController = new CategoriesController();
      return categoriesController.create(request, reply);
    },
  );
}
