import { FastifyReply, FastifyRequest } from "fastify";
import { listTransactionsByFiltersSchema } from "../../../dtos/list-transactions-filters.dto";
import { FetchTransactionsByFiltersUseCase } from "../../../use-cases/fetch-transactions-by-filters";
import { PrismaTransactionsRepository } from "../../../repositories/prisma/prisma-transactions-repository";

export class FetchTransactionsByFiltersController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const { success, data, error } = listTransactionsByFiltersSchema.safeParse(
      request.query,
    );

    if (!success) {
      return reply.code(400).send({
        errors: error.issues.map((issue) => ({
          campo: issue.path[0],
          message: issue.message,
        })),
      });
    }

    const transactionsRepository = new PrismaTransactionsRepository();
    const fetchTransactionsByFiltersUseCase =
      new FetchTransactionsByFiltersUseCase(transactionsRepository);

    const transactions = await fetchTransactionsByFiltersUseCase.execute({
      search: data.search,
      categoryId: data.category,
      type: data.type,
      initialDate: data.initialDate,
      finalDate: data.finalDate,
      userId: (request.user as { name: string; sub: string }).sub,
      page: data.page ? Number(data.page) : undefined,
      perPage: data.perPage ? Number(data.perPage) : undefined,
    });

    return reply.code(200).send(transactions);
  }
}
