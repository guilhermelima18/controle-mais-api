import { describe, expect, it, beforeEach } from "vitest";
import { InMemoryStatementImportsRepository } from "../in-memory-statement-imports-repository";
import { InMemoryExtractedTransactionsRepository } from "../in-memory-extracted-transactions-repository";
import { InMemoryCategoriesRepository } from "../../categories/in-memory-categories-repository";
import { UpdateExtractedTransactionUseCase } from "../../../../../src/modules/statement-imports/use-cases/update-extracted-transaction";
import { ResourceNotFoundError } from "../../../../../src/core/errors/resource-not-found-error";
import { StatementImportAlreadyConfirmedError } from "../../../../../src/modules/statement-imports/use-cases/errors/statement-import-already-confirmed-error";
import { CategoryNotFoundError } from "../../../../../src/modules/statement-imports/use-cases/errors/category-not-found-error";

let statementImportsRepository: InMemoryStatementImportsRepository;
let extractedTransactionsRepository: InMemoryExtractedTransactionsRepository;
let categoriesRepository: InMemoryCategoriesRepository;
let sut: UpdateExtractedTransactionUseCase;

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

describe("UpdateExtractedTransactionUseCase", () => {
  beforeEach(() => {
    statementImportsRepository = new InMemoryStatementImportsRepository();
    extractedTransactionsRepository = new InMemoryExtractedTransactionsRepository();
    categoriesRepository = new InMemoryCategoriesRepository();
    sut = new UpdateExtractedTransactionUseCase(
      statementImportsRepository,
      extractedTransactionsRepository,
      categoriesRepository,
    );
  });

  it("edita os campos informados no caminho feliz", async () => {
    const { statementImport, extractedTransaction } =
      await seedStatementImportWithTransaction("user-1");

    const updated = await sut.execute({
      statementImportId: statementImport.id,
      extractedTransactionId: extractedTransaction.id,
      userId: "user-1",
      data: { amount: 99.9 },
    });

    expect(Number(updated.amount)).toEqual(99.9);
  });

  it("lança ResourceNotFoundError quando o import não pertence ao usuário", async () => {
    const { statementImport, extractedTransaction } =
      await seedStatementImportWithTransaction("user-1");

    await expect(() =>
      sut.execute({
        statementImportId: statementImport.id,
        extractedTransactionId: extractedTransaction.id,
        userId: "user-2",
        data: { amount: 1 },
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
        data: { amount: 1 },
      }),
    ).rejects.toBeInstanceOf(StatementImportAlreadyConfirmedError);
  });

  it("lança CategoryNotFoundError quando categoryId não existe", async () => {
    const { statementImport, extractedTransaction } =
      await seedStatementImportWithTransaction("user-1");

    await expect(() =>
      sut.execute({
        statementImportId: statementImport.id,
        extractedTransactionId: extractedTransaction.id,
        userId: "user-1",
        data: { categoryId: "inexistente" },
      }),
    ).rejects.toBeInstanceOf(CategoryNotFoundError);
  });
});
