import { describe, expect, it, beforeEach } from "vitest";
import { InMemoryStatementImportsRepository } from "../in-memory-statement-imports-repository";
import { InMemoryExtractedTransactionsRepository } from "../in-memory-extracted-transactions-repository";
import { FetchStatementImportUseCase } from "../../../../../src/modules/statement-imports/use-cases/fetch-statement-import";
import { ResourceNotFoundError } from "../../../../../src/core/errors/resource-not-found-error";

let statementImportsRepository: InMemoryStatementImportsRepository;
let extractedTransactionsRepository: InMemoryExtractedTransactionsRepository;
let sut: FetchStatementImportUseCase;

describe("FetchStatementImportUseCase", () => {
  beforeEach(() => {
    statementImportsRepository = new InMemoryStatementImportsRepository();
    extractedTransactionsRepository = new InMemoryExtractedTransactionsRepository();
    sut = new FetchStatementImportUseCase(
      statementImportsRepository,
      extractedTransactionsRepository,
    );
  });

  it("retorna o import e suas transações extraídas quando pertence ao usuário", async () => {
    const statementImport = await statementImportsRepository.create({
      fileName: "extrato.csv",
      fileFormat: "CSV",
      fileContent: Buffer.from(""),
      userId: "user-1",
    });
    await extractedTransactionsRepository.createMany(statementImport.id, [
      { date: "2026-07-01", description: "X", amount: 10, type: "EXPENSE" },
    ]);

    const result = await sut.execute({
      statementImportId: statementImport.id,
      userId: "user-1",
    });

    expect(result.statementImport.id).toEqual(statementImport.id);
    expect(result.extractedTransactions).toHaveLength(1);
  });

  it("lança ResourceNotFoundError quando o import não existe ou é de outro usuário", async () => {
    const statementImport = await statementImportsRepository.create({
      fileName: "extrato.csv",
      fileFormat: "CSV",
      fileContent: Buffer.from(""),
      userId: "user-1",
    });

    await expect(() =>
      sut.execute({ statementImportId: statementImport.id, userId: "user-2" }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);

    await expect(() =>
      sut.execute({ statementImportId: "inexistente", userId: "user-1" }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
