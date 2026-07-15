import { describe, expect, it, beforeEach } from "vitest";
import { InMemoryStatementImportsRepository } from "../in-memory-statement-imports-repository";
import { InMemoryExtractedTransactionsRepository } from "../in-memory-extracted-transactions-repository";
import { DiscardExtractedTransactionUseCase } from "../../../../../src/modules/statement-imports/use-cases/discard-extracted-transaction";
import { ResourceNotFoundError } from "../../../../../src/core/errors/resource-not-found-error";
import { StatementImportAlreadyConfirmedError } from "../../../../../src/modules/statement-imports/use-cases/errors/statement-import-already-confirmed-error";

let statementImportsRepository: InMemoryStatementImportsRepository;
let extractedTransactionsRepository: InMemoryExtractedTransactionsRepository;
let sut: DiscardExtractedTransactionUseCase;

async function seedStatementImportWithTransaction(userId: string) {
  const statementImport = await statementImportsRepository.create({
    fileName: "extrato.csv",
    fileFormat: "CSV",
    fileContent: Buffer.from(""),
    userId,
  });
  const [extractedTransaction] = await extractedTransactionsRepository.createMany(
    statementImport.id,
    [{ date: "2026-07-01", description: "X", amount: 10, type: "EXPENSE" }],
  );
  return { statementImport, extractedTransaction };
}

describe("DiscardExtractedTransactionUseCase", () => {
  beforeEach(() => {
    statementImportsRepository = new InMemoryStatementImportsRepository();
    extractedTransactionsRepository = new InMemoryExtractedTransactionsRepository();
    sut = new DiscardExtractedTransactionUseCase(
      statementImportsRepository,
      extractedTransactionsRepository,
    );
  });

  it("marca discarded = true no caminho feliz", async () => {
    const { statementImport, extractedTransaction } =
      await seedStatementImportWithTransaction("user-1");

    await sut.execute({
      statementImportId: statementImport.id,
      extractedTransactionId: extractedTransaction.id,
      userId: "user-1",
    });

    const updated = extractedTransactionsRepository.items.find(
      (item) => item.id === extractedTransaction.id,
    );
    expect(updated?.discarded).toEqual(true);
  });

  it("lança ResourceNotFoundError quando o import não pertence ao usuário", async () => {
    const { statementImport, extractedTransaction } =
      await seedStatementImportWithTransaction("user-1");

    await expect(() =>
      sut.execute({
        statementImportId: statementImport.id,
        extractedTransactionId: extractedTransaction.id,
        userId: "user-2",
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it("lança StatementImportAlreadyConfirmedError quando o import já está confirmado", async () => {
    const { statementImport, extractedTransaction } =
      await seedStatementImportWithTransaction("user-1");
    await statementImportsRepository.update(statementImport.id, {
      status: "CONFIRMED",
    });

    await expect(() =>
      sut.execute({
        statementImportId: statementImport.id,
        extractedTransactionId: extractedTransaction.id,
        userId: "user-1",
      }),
    ).rejects.toBeInstanceOf(StatementImportAlreadyConfirmedError);
  });
});
