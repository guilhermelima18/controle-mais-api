import { FastifyReply, FastifyRequest } from "fastify";
import { updateExtractedTransactionSchema } from "../../../dtos/update-extracted-transaction.dto";
import { UpdateExtractedTransactionUseCase } from "../../../use-cases/update-extracted-transaction";
import { PrismaStatementImportsRepository } from "../../../repositories/prisma/prisma-statement-imports-repository";
import { PrismaExtractedTransactionsRepository } from "../../../repositories/prisma/prisma-extracted-transactions-repository";
import { PrismaCategoriesRepository } from "../../../../categories/repositories/prisma/prisma-categories-repository";

export class UpdateExtractedTransactionController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const { id, extractedTransactionId } = request.params as {
      id: string;
      extractedTransactionId: string;
    };

    const { success, data, error } = updateExtractedTransactionSchema.safeParse(
      request.body,
    );

    if (!success) {
      return reply.code(400).send({
        errors: error.issues.map((issue) => ({
          campo: issue.path[0],
          message: issue.message,
        })),
      });
    }

    const statementImportsRepository = new PrismaStatementImportsRepository();
    const extractedTransactionsRepository =
      new PrismaExtractedTransactionsRepository();
    const categoriesRepository = new PrismaCategoriesRepository();
    const updateExtractedTransactionUseCase = new UpdateExtractedTransactionUseCase(
      statementImportsRepository,
      extractedTransactionsRepository,
      categoriesRepository,
    );

    const extractedTransaction = await updateExtractedTransactionUseCase.execute({
      statementImportId: id,
      extractedTransactionId,
      userId: (request.user as { name: string; sub: string }).sub,
      data,
    });

    return reply.code(200).send(extractedTransaction.toJSON());
  }
}
