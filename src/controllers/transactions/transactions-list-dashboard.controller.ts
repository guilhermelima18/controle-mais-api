import { FastifyReply, FastifyRequest } from "fastify";
import { TransactionsListDashboardService } from "@/services/transactions/transactions-list-dashboard.service";

export class TransactionsListDashboardController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    try {
      const transactionsService = new TransactionsListDashboardService();
      const transactions = await transactionsService.execute({
        user: request.user as { name: string; sub: string },
      });

      return reply.code(200).send(transactions);
    } catch (error) {
      console.log(error);
      return reply.status(500).send({ error: "Erro interno do servidor." });
    }
  }
}
