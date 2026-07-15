import { FastifyReply, FastifyRequest } from "fastify";
import { ConfirmStatementImportUseCase } from "../../../use-cases/confirm-statement-import";
import { PrismaStatementImportsRepository } from "../../../repositories/prisma/prisma-statement-imports-repository";
import { PrismaExtractedTransactionsRepository } from "../../../repositories/prisma/prisma-extracted-transactions-repository";
import { PrismaTransactionsRepository } from "../../../../transactions/repositories/prisma/prisma-transactions-repository";

export class ConfirmStatementImportController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    const statementImportsRepository = new PrismaStatementImportsRepository();
    const extractedTransactionsRepository =
      new PrismaExtractedTransactionsRepository();
    const transactionsRepository = new PrismaTransactionsRepository();
    const confirmStatementImportUseCase = new ConfirmStatementImportUseCase(
      statementImportsRepository,
      extractedTransactionsRepository,
      transactionsRepository,
    );

    const { statementImport, createdTransactions } =
      await confirmStatementImportUseCase.execute({
        statementImportId: id,
        userId: (request.user as { name: string; sub: string }).sub,
      });

    return reply.code(200).send({
      statementImport: statementImport.toJSON(),
      createdTransactions: createdTransactions.map((transaction) =>
        transaction.toJSON(),
      ),
    });
  }
}
