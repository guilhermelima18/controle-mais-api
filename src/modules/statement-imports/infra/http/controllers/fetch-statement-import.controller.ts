import { FastifyReply, FastifyRequest } from "fastify";
import { FetchStatementImportUseCase } from "../../../use-cases/fetch-statement-import";
import { PrismaStatementImportsRepository } from "../../../repositories/prisma/prisma-statement-imports-repository";
import { PrismaExtractedTransactionsRepository } from "../../../repositories/prisma/prisma-extracted-transactions-repository";

export class FetchStatementImportController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    const statementImportsRepository = new PrismaStatementImportsRepository();
    const extractedTransactionsRepository =
      new PrismaExtractedTransactionsRepository();
    const fetchStatementImportUseCase = new FetchStatementImportUseCase(
      statementImportsRepository,
      extractedTransactionsRepository,
    );

    const { statementImport, extractedTransactions } =
      await fetchStatementImportUseCase.execute({
        statementImportId: id,
        userId: (request.user as { name: string; sub: string }).sub,
      });

    return reply.code(200).send({
      statementImport: statementImport.toJSON(),
      extractedTransactions: extractedTransactions.map((extractedTransaction) =>
        extractedTransaction.toJSON(),
      ),
    });
  }
}
