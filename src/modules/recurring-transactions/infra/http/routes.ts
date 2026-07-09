import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { CreateRecurringTransactionController } from "./controllers/create-recurring-transaction.controller";
import { FetchRecurringTransactionsController } from "./controllers/fetch-recurring-transactions.controller";
import { FetchRecurringTransactionController } from "./controllers/fetch-recurring-transaction.controller";
import { UpdateRecurringTransactionController } from "./controllers/update-recurring-transaction.controller";
import { DeleteRecurringTransactionController } from "./controllers/delete-recurring-transaction.controller";

export async function recurringTransactionsRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/",
    { onRequest: [fastify.authenticate] },
    (request: FastifyRequest, reply: FastifyReply) => {
      const controller = new CreateRecurringTransactionController();
      return controller.handle(request, reply);
    },
  );

  fastify.get(
    "/",
    { onRequest: [fastify.authenticate] },
    (request: FastifyRequest, reply: FastifyReply) => {
      const controller = new FetchRecurringTransactionsController();
      return controller.handle(request, reply);
    },
  );

  fastify.get(
    "/:id",
    { onRequest: [fastify.authenticate] },
    (request: FastifyRequest, reply: FastifyReply) => {
      const controller = new FetchRecurringTransactionController();
      return controller.handle(request, reply);
    },
  );

  fastify.put(
    "/:id",
    { onRequest: [fastify.authenticate] },
    (request: FastifyRequest, reply: FastifyReply) => {
      const controller = new UpdateRecurringTransactionController();
      return controller.handle(request, reply);
    },
  );

  fastify.delete(
    "/:id",
    { onRequest: [fastify.authenticate] },
    (request: FastifyRequest, reply: FastifyReply) => {
      const controller = new DeleteRecurringTransactionController();
      return controller.handle(request, reply);
    },
  );
}
