import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { TransactionCreateController } from "@/controllers/transactions/transaction-create.controller";

export async function transactionCreateRoute(fastify: FastifyInstance) {
  fastify.post(
    "/",
    {
      onRequest: [fastify.authenticate],
    },
    (request: FastifyRequest, reply: FastifyReply) => {
      const transactionsController = new TransactionCreateController();
      return transactionsController.handle(request, reply);
    },
  );
}
