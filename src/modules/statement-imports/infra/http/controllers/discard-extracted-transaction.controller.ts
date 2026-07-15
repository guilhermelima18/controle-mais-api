import { FastifyReply, FastifyRequest } from "fastify";
import { DiscardExtractedTransactionUseCase } from "../../../use-cases/discard-extracted-transaction";
import { PrismaStatementImportsRepository } from "../../../repositories/prisma/prisma-statement-imports-repository";
import { PrismaExtractedTransactionsRepository } from "../../../repositories/prisma/prisma-extracted-transactions-repository";

export class DiscardExtractedTransactionController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const { id, extractedTransactionId } = request.params as {
      id: string;
      extractedTransactionId: string;
    };

    const statementImportsRepository = new PrismaStatementImportsRepository();
    const extractedTransactionsRepository =
      new PrismaExtractedTransactionsRepository();
    const discardExtractedTransactionUseCase =
      new DiscardExtractedTransactionUseCase(
        statementImportsRepository,
        extractedTransactionsRepository,
      );

    await discardExtractedTransactionUseCase.execute({
      statementImportId: id,
      extractedTransactionId,
      userId: (request.user as { name: string; sub: string }).sub,
    });

    return reply.code(204).send();
  }
}
