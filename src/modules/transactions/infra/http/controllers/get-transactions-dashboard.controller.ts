import { FastifyReply, FastifyRequest } from "fastify";
import { GetTransactionsDashboardUseCase } from "../../../use-cases/get-transactions-dashboard";
import { PrismaTransactionsRepository } from "../../../repositories/prisma/prisma-transactions-repository";

export class GetTransactionsDashboardController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const transactionsRepository = new PrismaTransactionsRepository();
    const getTransactionsDashboardUseCase = new GetTransactionsDashboardUseCase(
      transactionsRepository,
    );

    const dashboard = await getTransactionsDashboardUseCase.execute({
      userId: (request.user as { name: string; sub: string }).sub,
    });

    return reply.code(200).send(dashboard);
  }
}
