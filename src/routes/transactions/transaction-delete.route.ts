import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { TransactionDeleteController } from "@/controllers/transactions/transaction-delete.controller";

export async function transactionDeleteRoute(fastify: FastifyInstance) {
  fastify.delete(
    "/:id",
    {
      onRequest: [fastify.authenticate],
    },
    (request: FastifyRequest, reply: FastifyReply) => {
      const transactionsController = new TransactionDeleteController();
      return transactionsController.handle(request, reply);
    },
  );
}
