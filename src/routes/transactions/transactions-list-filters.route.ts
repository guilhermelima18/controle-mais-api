import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { TransactionsListFiltersController } from "../../controllers/transactions/transactions-list-filters.controller";

export async function transactionsListFiltersRoute(fastify: FastifyInstance) {
  fastify.get(
    "/",
    {
      onRequest: [fastify.authenticate],
    },
    (request: FastifyRequest, reply: FastifyReply) => {
      const transactionsController = new TransactionsListFiltersController();
      return transactionsController.handle(request, reply);
    },
  );
}
