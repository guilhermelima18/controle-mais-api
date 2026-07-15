import { randomUUID } from "node:crypto";
import { StatementImport } from "../../../../src/modules/statement-imports/entities/statement-import";
import {
  IStatementImportsRepository,
  StatementImportCreateData,
  StatementImportUpdateData,
} from "../../../../src/modules/statement-imports/repositories/istatement-imports-repository";

export class InMemoryStatementImportsRepository
  implements IStatementImportsRepository
{
  public items: StatementImport[] = [];

  async create(data: StatementImportCreateData): Promise<StatementImport> {
    const statementImport = new StatementImport({
      id: randomUUID(),
      fileName: data.fileName,
      fileFormat: data.fileFormat,
      fileContent: data.fileContent,
      status: "RECEIVED",
      extractionMethod: null,
      failureReason: null,
      userId: data.userId,
      createdAt: new Date(),
      confirmedAt: null,
    });

    this.items.push(statementImport);
    return statementImport;
  }

  async update(
    statementImportId: string,
    data: StatementImportUpdateData,
  ): Promise<StatementImport> {
    const index = this.items.findIndex(
      (item) => item.id === statementImportId,
    );
    if (index === -1) {
      throw new Error("StatementImport not found.");
    }

    const current = this.items[index];
    const updated = new StatementImport({
      id: current.id,
      fileName: current.fileName,
      fileFormat: current.fileFormat,
      fileContent: current.fileContent,
      status: data.status ?? current.status,
      extractionMethod:
        data.extractionMethod !== undefined
          ? data.extractionMethod
          : current.extractionMethod,
      failureReason:
        data.failureReason !== undefined
          ? data.failureReason
          : current.failureReason,
      userId: current.userId,
      createdAt: current.createdAt,
      confirmedAt: data.confirmedAt ?? current.confirmedAt,
    });

    this.items[index] = updated;
    return updated;
  }

  async findByIdAndUser(
    statementImportId: string,
    userId: string,
  ): Promise<StatementImport | null> {
    return (
      this.items.find(
        (item) => item.id === statementImportId && item.userId === userId,
      ) ?? null
    );
  }
}
