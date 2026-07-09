import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { CreateTransactionController } from "./controllers/create-transaction.controller";
import { UpdateTransactionController } from "./controllers/update-transaction.controller";
import { DeleteTransactionController } from "./controllers/delete-transaction.controller";
import { FetchTransactionController } from "./controllers/fetch-transaction.controller";
import { FetchTransactionsByFiltersController } from "./controllers/fetch-transactions-by-filters.controller";
import { GetTransactionsDashboardController } from "./controllers/get-transactions-dashboard.controller";

export async function transactionsRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/",
    { onRequest: [fastify.authenticate] },
    (request: FastifyRequest, reply: FastifyReply) => {
      const controller = new CreateTransactionController();
      return controller.handle(request, reply);
    },
  );

  fastify.get(
    "/",
    { onRequest: [fastify.authenticate] },
    (request: FastifyRequest, reply: FastifyReply) => {
      const controller = new FetchTransactionsByFiltersController();
      return controller.handle(request, reply);
    },
  );

  fastify.get(
    "/dashboard",
    { onRequest: [fastify.authenticate] },
    (request: FastifyRequest, reply: FastifyReply) => {
      const controller = new GetTransactionsDashboardController();
      return controller.handle(request, reply);
    },
  );

  fastify.get(
    "/:id",
    { onRequest: [fastify.authenticate] },
    (request: FastifyRequest, reply: FastifyReply) => {
      const controller = new FetchTransactionController();
      return controller.handle(request, reply);
    },
  );

  fastify.put(
    "/:id",
    { onRequest: [fastify.authenticate] },
    (request: FastifyRequest, reply: FastifyReply) => {
      const controller = new UpdateTransactionController();
      return controller.handle(request, reply);
    },
  );

  fastify.delete(
    "/:id",
    { onRequest: [fastify.authenticate] },
    (request: FastifyRequest, reply: FastifyReply) => {
      const controller = new DeleteTransactionController();
      return controller.handle(request, reply);
    },
  );
}
