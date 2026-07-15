import { describe, expect, it, beforeEach } from "vitest";
import { InMemoryStatementImportsRepository } from "../in-memory-statement-imports-repository";
import { InMemoryExtractedTransactionsRepository } from "../in-memory-extracted-transactions-repository";
import { InMemoryCategoriesRepository } from "../../categories/in-memory-categories-repository";
import { InMemoryTransactionsRepository } from "../../transactions/in-memory-transactions-repository";
import { FakeStatementFileParser } from "../fake-statement-file-parser";
import { ImportStatementUseCase } from "../../../../../src/modules/statement-imports/use-cases/import-statement";
import { UnsupportedFileFormatError } from "../../../../../src/modules/statement-imports/use-cases/errors/unsupported-file-format-error";
import { FileTooLargeError } from "../../../../../src/modules/statement-imports/use-cases/errors/file-too-large-error";
import { StatementExtractionFailedError } from "../../../../../src/modules/statement-imports/use-cases/errors/statement-extraction-failed-error";

let statementImportsRepository: InMemoryStatementImportsRepository;
let extractedTransactionsRepository: InMemoryExtractedTransactionsRepository;
let categoriesRepository: InMemoryCategoriesRepository;
let transactionsRepository: InMemoryTransactionsRepository;

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function makeSut(parser: FakeStatementFileParser) {
  return new ImportStatementUseCase(
    statementImportsRepository,
    extractedTransactionsRepository,
    categoriesRepository,
    transactionsRepository,
    parser,
    MAX_FILE_SIZE_BYTES,
  );
}

describe("ImportStatementUseCase", () => {
  beforeEach(() => {
    statementImportsRepository = new InMemoryStatementImportsRepository();
    extractedTransactionsRepository = new InMemoryExtractedTransactionsRepository();
    categoriesRepository = new InMemoryCategoriesRepository();
    transactionsRepository = new InMemoryTransactionsRepository();
  });

  it("cria o import e as transações extraídas no caminho feliz, resolvendo a categoria sugerida", async () => {
    const category = await categoriesRepository.create({
      name: "Mercado",
      type: "EXPENSE",
    });

    const parser = new FakeStatementFileParser({
      kind: "succeed",
      result: {
        method: "AI",
        transactions: [
          {
            date: "2026-07-01",
            description: "SUPERMERCADO ABC",
            amount: 150.32,
            type: "EXPENSE",
            suggestedCategoryName: "mercado",
          },
        ],
      },
    });

    const sut = makeSut(parser);

    const { statementImport, extractedTransactions } = await sut.execute({
      fileName: "extrato.csv",
      fileFormat: "CSV",
      fileBuffer: Buffer.from("conteúdo"),
      userId: "user-1",
    });

    expect(statementImport.status).toEqual("READY_FOR_REVIEW");
    expect(statementImport.extractionMethod).toEqual("AI");
    expect(extractedTransactions).toHaveLength(1);
    expect(extractedTransactions[0].categoryId).toEqual(category.id);
    expect(extractedTransactions[0].isDuplicate).toEqual(false);
  });

  it("marca NO_TRANSACTIONS_FOUND quando o parser não encontra nenhuma transação", async () => {
    const parser = new FakeStatementFileParser({
      kind: "succeed",
      result: { method: "AI", transactions: [] },
    });

    const sut = makeSut(parser);

    const { statementImport, extractedTransactions } = await sut.execute({
      fileName: "extrato.txt",
      fileFormat: "TXT",
      fileBuffer: Buffer.from(""),
      userId: "user-1",
    });

    expect(statementImport.status).toEqual("NO_TRANSACTIONS_FOUND");
    expect(extractedTransactions).toHaveLength(0);
  });

  it("lança UnsupportedFileFormatError sem persistir nada quando o formato não é suportado", async () => {
    const parser = new FakeStatementFileParser({
      kind: "succeed",
      result: { method: "AI", transactions: [] },
    });
    const sut = makeSut(parser);

    await expect(() =>
      sut.execute({
        fileName: "extrato.docx",
        fileFormat: null,
        fileBuffer: Buffer.from("conteúdo"),
        userId: "user-1",
      }),
    ).rejects.toBeInstanceOf(UnsupportedFileFormatError);

    expect(statementImportsRepository.items).toHaveLength(0);
  });

  it("lança FileTooLargeError quando o arquivo excede o limite configurado", async () => {
    const parser = new FakeStatementFileParser({
      kind: "succeed",
      result: { method: "AI", transactions: [] },
    });
    const sut = new ImportStatementUseCase(
      statementImportsRepository,
      extractedTransactionsRepository,
      categoriesRepository,
      transactionsRepository,
      parser,
      10,
    );

    await expect(() =>
      sut.execute({
        fileName: "extrato.csv",
        fileFormat: "CSV",
        fileBuffer: Buffer.alloc(11),
        userId: "user-1",
      }),
    ).rejects.toBeInstanceOf(FileTooLargeError);

    expect(statementImportsRepository.items).toHaveLength(0);
  });

  it("marca o import como FAILED e lança StatementExtractionFailedError quando o parser falha", async () => {
    const parser = new FakeStatementFileParser({
      kind: "fail",
      error: new Error("IA e fallback indisponíveis"),
    });
    const sut = makeSut(parser);

    await expect(() =>
      sut.execute({
        fileName: "extrato.csv",
        fileFormat: "CSV",
        fileBuffer: Buffer.from("conteúdo"),
        userId: "user-1",
      }),
    ).rejects.toBeInstanceOf(StatementExtractionFailedError);

    expect(statementImportsRepository.items[0].status).toEqual("FAILED");
    expect(statementImportsRepository.items[0].failureReason).toEqual(
      "IA e fallback indisponíveis",
    );
    expect(statementImportsRepository.items[0].extractionMethod).toBeNull();
  });

  it("marca isDuplicate: true quando já existe uma Transaction do usuário com mesma data, valor e descrição normalizada", async () => {
    await transactionsRepository.create({
      description: "  Supermercado ABC  ",
      amount: 150.32,
      type: "EXPENSE",
      date: "2026-07-01T00:00:00.000Z",
      userId: "user-1",
      categoryId: "cat-1",
    });

    const parser = new FakeStatementFileParser({
      kind: "succeed",
      result: {
        method: "AI",
        transactions: [
          {
            date: "2026-07-01",
            description: "SUPERMERCADO ABC",
            amount: 150.32,
            type: "EXPENSE",
          },
        ],
      },
    });

    const sut = makeSut(parser);

    const { extractedTransactions } = await sut.execute({
      fileName: "extrato.csv",
      fileFormat: "CSV",
      fileBuffer: Buffer.from("conteúdo"),
      userId: "user-1",
    });

    expect(extractedTransactions[0].isDuplicate).toEqual(true);
  });

  it("marca isDuplicate: false quando não há Transaction correspondente", async () => {
    const parser = new FakeStatementFileParser({
      kind: "succeed",
      result: {
        method: "AI",
        transactions: [
          {
            date: "2026-07-01",
            description: "SUPERMERCADO ABC",
            amount: 150.32,
            type: "EXPENSE",
          },
        ],
      },
    });

    const sut = makeSut(parser);

    const { extractedTransactions } = await sut.execute({
      fileName: "extrato.csv",
      fileFormat: "CSV",
      fileBuffer: Buffer.from("conteúdo"),
      userId: "user-1",
    });

    expect(extractedTransactions[0].isDuplicate).toEqual(false);
  });
});
