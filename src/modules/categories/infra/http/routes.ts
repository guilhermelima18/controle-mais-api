import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { CreateCategoryController } from "./controllers/create-category.controller";
import { FetchCategoryController } from "./controllers/fetch-category.controller";
import { FetchCategoriesController } from "./controllers/fetch-categories.controller";

export async function categoriesRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/",
    { onRequest: [fastify.authenticate] },
    (request: FastifyRequest, reply: FastifyReply) => {
      const controller = new CreateCategoryController();
      return controller.handle(request, reply);
    },
  );

  fastify.get(
    "/",
    { onRequest: [fastify.authenticate] },
    (request: FastifyRequest, reply: FastifyReply) => {
      const controller = new FetchCategoriesController();
      return controller.handle(request, reply);
    },
  );

  fastify.get(
    "/:id",
    { onRequest: [fastify.authenticate] },
    (request: FastifyRequest, reply: FastifyReply) => {
      const controller = new FetchCategoryController();
      return controller.handle(request, reply);
    },
  );
}
