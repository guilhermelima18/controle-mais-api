import { FastifyReply, FastifyRequest } from "fastify";
import { FetchRecurringTransactionUseCase } from "../../../use-cases/fetch-recurring-transaction";
import { PrismaRecurringTransactionsRepository } from "../../../repositories/prisma/prisma-recurring-transactions-repository";

export class FetchRecurringTransactionController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const { id: recurringTransactionId } = request.params as { id: string };

    const recurringTransactionsRepository =
      new PrismaRecurringTransactionsRepository();
    const fetchRecurringTransactionUseCase = new FetchRecurringTransactionUseCase(
      recurringTransactionsRepository,
    );

    const recurringTransaction = await fetchRecurringTransactionUseCase.execute({
      recurringTransactionId,
      userId: (request.user as { name: string; sub: string }).sub,
    });

    return reply.code(200).send(recurringTransaction);
  }
}
