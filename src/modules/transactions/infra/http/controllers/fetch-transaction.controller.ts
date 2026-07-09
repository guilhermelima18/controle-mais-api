import { FastifyReply, FastifyRequest } from "fastify";
import { FetchTransactionUseCase } from "../../../use-cases/fetch-transaction";
import { PrismaTransactionsRepository } from "../../../repositories/prisma/prisma-transactions-repository";

export class FetchTransactionController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const { id: transactionId } = request.params as { id: string };

    const transactionsRepository = new PrismaTransactionsRepository();
    const fetchTransactionUseCase = new FetchTransactionUseCase(
      transactionsRepository,
    );

    const transaction = await fetchTransactionUseCase.execute({
      transactionId,
      userId: (request.user as { name: string; sub: string }).sub,
    });

    return reply.code(200).send(transaction);
  }
}
