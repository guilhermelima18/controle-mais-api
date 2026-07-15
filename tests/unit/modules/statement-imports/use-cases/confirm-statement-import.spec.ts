import { describe, expect, it, beforeEach } from "vitest";
import { InMemoryStatementImportsRepository } from "../in-memory-statement-imports-repository";
import { InMemoryExtractedTransactionsRepository } from "../in-memory-extracted-transactions-repository";
import { InMemoryTransactionsRepository } from "../../transactions/in-memory-transactions-repository";
import { ConfirmStatementImportUseCase } from "../../../../../src/modules/statement-imports/use-cases/confirm-statement-import";
import { ResourceNotFoundError } from "../../../../../src/core/errors/resource-not-found-error";
import { StatementImportAlreadyConfirmedError } from "../../../../../src/modules/statement-imports/use-cases/errors/statement-import-already-confirmed-error";
import { MissingCategoryForConfirmationError } from "../../../../../src/modules/statement-imports/use-cases/errors/missing-category-for-confirmation-error";

let statementImportsRepository: InMemoryStatementImportsRepository;
let extractedTransactionsRepository: InMemoryExtractedTransactionsRepository;
let transactionsRepository: InMemoryTransactionsRepository;
let sut: ConfirmStatementImportUseCase;

describe("ConfirmStatementImportUseCase", () => {
  beforeEach(() => {
    statementImportsRepository = new InMemoryStatementImportsRepository();
    extractedTransactionsRepository = new InMemoryExtractedTransactionsRepository();
    transactionsRepository = new InMemoryTransactionsRepository();
    sut = new ConfirmStatementImportUseCase(
      statementImportsRepository,
      extractedTransactionsRepository,
      transactionsRepository,
    );
  });

  it("cria uma Transaction por item não descartado, com extractedTransactionId, e confirma o import", async () => {
    const statementImport = await statementImportsRepository.create({
      fileName: "extrato.csv",
      fileFormat: "CSV",
      fileContent: Buffer.from(""),
      userId: "user-1",
    });
    const [keep, discard] = await extractedTransactionsRepository.createMany(
      statementImport.id,
      [
        {
          date: "2026-07-01",
          description: "Mercado",
          amount: 100,
          type: "EXPENSE",
          categoryId: "cat-1",
        },
        {
          date: "2026-07-02",
          description: "Descartado",
          amount: 50,
          type: "EXPENSE",
          categoryId: "cat-1",
        },
      ],
    );
    await extractedTransactionsRepository.update(discard.id, { discarded: true });

    const result = await sut.execute({
      statementImportId: statementImport.id,
      userId: "user-1",
    });

    expect(result.statementImport.status).toEqual("CONFIRMED");
    expect(result.statementImport.confirmedAt).not.toBeNull();
    expect(result.createdTransactions).toHaveLength(1);
    expect(result.createdTransactions[0].extractedTransactionId).toEqual(keep.id);
    expect(transactionsRepository.items).toHaveLength(1);
  });

  it("lança MissingCategoryForConfirmationError quando falta categoria em item não descartado", async () => {
    const statementImport = await statementImportsRepository.create({
      fileName: "extrato.csv",
      fileFormat: "CSV",
      fileContent: Buffer.from(""),
      userId: "user-1",
    });
    await extractedTransactionsRepository.createMany(statementImport.id, [
      { date: "2026-07-01", description: "Mercado", amount: 100, type: "EXPENSE" },
    ]);

    await expect(() =>
      sut.execute({ statementImportId: statementImport.id, userId: "user-1" }),
    ).rejects.toBeInstanceOf(MissingCategoryForConfirmationError);
  });

  it("lança StatementImportAlreadyConfirmedError ao tentar reconfirmar", async () => {
    const statementImport = await statementImportsRepository.create({
      fileName: "extrato.csv",
      fileFormat: "CSV",
      fileContent: Buffer.from(""),
      userId: "user-1",
    });
    await statementImportsRepository.update(statementImport.id, {
      status: "CONFIRMED",
    });

    await expect(() =>
      sut.execute({ statementImportId: statementImport.id, userId: "user-1" }),
    ).rejects.toBeInstanceOf(StatementImportAlreadyConfirmedError);
  });

  it("lança ResourceNotFoundError quando o import não pertence ao usuário", async () => {
    const statementImport = await statementImportsRepository.create({
      fileName: "extrato.csv",
      fileFormat: "CSV",
      fileContent: Buffer.from(""),
      userId: "user-1",
    });

    await expect(() =>
      sut.execute({ statementImportId: statementImport.id, userId: "user-2" }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
