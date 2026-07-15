import { randomUUID } from "node:crypto";
import { Decimal } from "@prisma/client/runtime/client";
import { ExtractedTransaction } from "../../../../src/modules/statement-imports/entities/extracted-transaction";
import {
  ExtractedTransactionCreateData,
  ExtractedTransactionUpdateData,
  IExtractedTransactionsRepository,
} from "../../../../src/modules/statement-imports/repositories/iextracted-transactions-repository";

export class InMemoryExtractedTransactionsRepository
  implements IExtractedTransactionsRepository
{
  public items: ExtractedTransaction[] = [];

  async createMany(
    statementImportId: string,
    items: ExtractedTransactionCreateData[],
  ): Promise<ExtractedTransaction[]> {
    const created = items.map(
      (item) =>
        new ExtractedTransaction({
          id: randomUUID(),
          date: new Date(item.date),
          description: item.description,
          amount: new Decimal(item.amount),
          type: item.type,
          isDuplicate: item.isDuplicate ?? false,
          discarded: false,
          statementImportId,
          categoryId: item.categoryId ?? null,
          createdAt: new Date(),
        }),
    );

    this.items.push(...created);
    return created;
  }

  async findManyByStatementImport(
    statementImportId: string,
  ): Promise<ExtractedTransaction[]> {
    return this.items.filter(
      (item) => item.statementImportId === statementImportId,
    );
  }

  async findByIdAndStatementImport(
    extractedTransactionId: string,
    statementImportId: string,
  ): Promise<ExtractedTransaction | null> {
    return (
      this.items.find(
        (item) =>
          item.id === extractedTransactionId &&
          item.statementImportId === statementImportId,
      ) ?? null
    );
  }

  async update(
    extractedTransactionId: string,
    data: ExtractedTransactionUpdateData,
  ): Promise<ExtractedTransaction> {
    const index = this.items.findIndex(
      (item) => item.id === extractedTransactionId,
    );
    if (index === -1) {
      throw new Error("ExtractedTransaction not found.");
    }

    const current = this.items[index];
    const updated = new ExtractedTransaction({
      id: current.id,
      date: data.date ? new Date(data.date) : current.date,
      description: data.description ?? current.description,
      amount:
        data.amount !== undefined ? new Decimal(data.amount) : current.amount,
      type: data.type ?? current.type,
      isDuplicate: current.isDuplicate,
      discarded: data.discarded ?? current.discarded,
      statementImportId: current.statementImportId,
      categoryId:
        data.categoryId !== undefined ? data.categoryId : current.categoryId,
      createdAt: current.createdAt,
    });

    this.items[index] = updated;
    return updated;
  }
}
