import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { TransactionUpdateController } from "../../controllers/transactions/transaction-update.controller";

export async function transactionUpdateRoute(fastify: FastifyInstance) {
  fastify.put(
    "/:id",
    {
      onRequest: [fastify.authenticate],
    },
    (request: FastifyRequest, reply: FastifyReply) => {
      const transactionsController = new TransactionUpdateController();
      return transactionsController.handle(request, reply);
    },
  );
}
