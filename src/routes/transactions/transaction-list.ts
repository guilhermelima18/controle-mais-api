import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { TransactionListController } from "../../controllers/transactions/transaction-list.controller";

export async function transactionListRoute(fastify: FastifyInstance) {
  fastify.get(
    "/:id",
    {
      onRequest: [fastify.authenticate],
    },
    (request: FastifyRequest, reply: FastifyReply) => {
      const transactionsController = new TransactionListController();
      return transactionsController.handle(request, reply);
    },
  );
}
