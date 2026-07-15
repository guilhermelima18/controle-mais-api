import { FastifyReply, FastifyRequest } from "fastify";
import { importStatementSchema, resolveFileFormat } from "../../../dtos/import-statement.dto";
import { ImportStatementUseCase } from "../../../use-cases/import-statement";
import { FileTooLargeError } from "../../../use-cases/errors/file-too-large-error";
import { PrismaStatementImportsRepository } from "../../../repositories/prisma/prisma-statement-imports-repository";
import { PrismaExtractedTransactionsRepository } from "../../../repositories/prisma/prisma-extracted-transactions-repository";
import { PrismaCategoriesRepository } from "../../../../categories/repositories/prisma/prisma-categories-repository";
import { PrismaTransactionsRepository } from "../../../../transactions/repositories/prisma/prisma-transactions-repository";
import { makeStatementFileParser } from "../../../providers/make-statement-file-parser";
import { env } from "../../../../../config/env";

export class ImportStatementController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const file = await request.file();

    const { success, data, error } = importStatementSchema.safeParse({
      fileName: file?.filename,
    });

    if (!success) {
      return reply.code(400).send({
        errors: error.issues.map((issue) => ({
          campo: issue.path[0],
          message: issue.message,
        })),
      });
    }

    let fileBuffer: Buffer;
    try {
      fileBuffer = await file!.toBuffer();
    } catch {
      throw new FileTooLargeError(env.statementImportMaxFileSizeBytes);
    }

    const fileFormat = resolveFileFormat(data.fileName);

    const statementImportsRepository = new PrismaStatementImportsRepository();
    const extractedTransactionsRepository =
      new PrismaExtractedTransactionsRepository();
    const categoriesRepository = new PrismaCategoriesRepository();
    const transactionsRepository = new PrismaTransactionsRepository();
    const statementFileParser = makeStatementFileParser();

    const importStatementUseCase = new ImportStatementUseCase(
      statementImportsRepository,
      extractedTransactionsRepository,
      categoriesRepository,
      transactionsRepository,
      statementFileParser,
      env.statementImportMaxFileSizeBytes,
    );

    const { statementImport, extractedTransactions } =
      await importStatementUseCase.execute({
        fileName: data.fileName,
        fileFormat,
        fileBuffer,
        userId: (request.user as { name: string; sub: string }).sub,
      });

    return reply.code(201).send({
      statementImport: statementImport.toJSON(),
      extractedTransactions: extractedTransactions.map((extractedTransaction) =>
        extractedTransaction.toJSON(),
      ),
    });
  }
}
