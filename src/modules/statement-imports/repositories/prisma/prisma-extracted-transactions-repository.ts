import { prisma } from "../../../../infra/database/prisma";
import { ExtractedTransaction } from "../../entities/extracted-transaction";
import {
  ExtractedTransactionCreateData,
  ExtractedTransactionUpdateData,
  IExtractedTransactionsRepository,
} from "../iextracted-transactions-repository";

export class PrismaExtractedTransactionsRepository
  implements IExtractedTransactionsRepository
{
  async createMany(
    statementImportId: string,
    items: ExtractedTransactionCreateData[],
  ): Promise<ExtractedTransaction[]> {
    if (items.length === 0) {
      return [];
    }

    await prisma.extractedTransaction.createMany({
      data: items.map((item) => ({
        ...item,
        date: new Date(item.date),
        statementImportId,
        isDuplicate: item.isDuplicate ?? false,
      })),
    });

    return this.findManyByStatementImport(statementImportId);
  }

  async findManyByStatementImport(
    statementImportId: string,
  ): Promise<ExtractedTransaction[]> {
    const extractedTransactions = await prisma.extractedTransaction.findMany({
      where: { statementImportId },
      orderBy: { date: "asc" },
    });
    return extractedTransactions.map(
      (extractedTransaction) => new ExtractedTransaction(extractedTransaction),
    );
  }

  async findByIdAndStatementImport(
    extractedTransactionId: string,
    statementImportId: string,
  ): Promise<ExtractedTransaction | null> {
    const extractedTransaction = await prisma.extractedTransaction.findUnique(
      {
        where: { id: extractedTransactionId, statementImportId },
      },
    );
    return extractedTransaction
      ? new ExtractedTransaction(extractedTransaction)
      : null;
  }

  async update(
    extractedTransactionId: string,
    data: ExtractedTransactionUpdateData,
  ): Promise<ExtractedTransaction> {
    const extractedTransaction = await prisma.extractedTransaction.update({
      where: { id: extractedTransactionId },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      },
    });
    return new ExtractedTransaction(extractedTransaction);
  }
}
