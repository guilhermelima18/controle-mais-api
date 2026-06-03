import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { TransactionsController } from "../../controllers/transactions";

export async function transactionsRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/",
    {
      onRequest: [fastify.authenticate],
    },
    (request: FastifyRequest, reply: FastifyReply) => {
      const transactionsController = new TransactionsController();
      return transactionsController.create(request, reply);
    },
  );
}
