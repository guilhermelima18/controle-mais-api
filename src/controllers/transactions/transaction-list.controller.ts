import { FastifyReply, FastifyRequest } from "fastify";
import { TransactionListService } from "@/services/transactions/transaction-list.service";

export class TransactionListController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id: transactionId } = request.params as { id: string };

      const transactionsService = new TransactionListService();
      const transaction = await transactionsService.execute({
        transactionId,
        user: request.user as { name: string; sub: string },
      });

      return reply.code(200).send(transaction);
    } catch (error) {
      console.log(error);
      return reply.status(500).send({ error: "Erro interno do servidor." });
    }
  }
}
