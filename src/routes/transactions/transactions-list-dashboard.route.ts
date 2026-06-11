import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { TransactionsListDashboardController } from "../../controllers/transactions/transactions-list-dashboard.controller";

export async function transactionsListDashboardRoute(fastify: FastifyInstance) {
  fastify.get(
    "/dashboard",
    {
      onRequest: [fastify.authenticate],
    },
    (request: FastifyRequest, reply: FastifyReply) => {
      const transactionsController = new TransactionsListDashboardController();
      return transactionsController.handle(request, reply);
    },
  );
}
