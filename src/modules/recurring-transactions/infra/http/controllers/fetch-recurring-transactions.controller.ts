import { FastifyReply, FastifyRequest } from "fastify";
import { FetchRecurringTransactionsUseCase } from "../../../use-cases/fetch-recurring-transactions";
import { PrismaRecurringTransactionsRepository } from "../../../repositories/prisma/prisma-recurring-transactions-repository";

export class FetchRecurringTransactionsController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const recurringTransactionsRepository =
      new PrismaRecurringTransactionsRepository();
    const fetchRecurringTransactionsUseCase =
      new FetchRecurringTransactionsUseCase(recurringTransactionsRepository);

    const recurringTransactions = await fetchRecurringTransactionsUseCase.execute({
      userId: (request.user as { name: string; sub: string }).sub,
    });

    return reply.code(200).send({ data: recurringTransactions });
  }
}
