import { IStatementImportsRepository } from "../repositories/istatement-imports-repository";
import { IExtractedTransactionsRepository } from "../repositories/iextracted-transactions-repository";
import { ICategoriesRepository } from "../../categories/repositories/icategories-repository";
import { ITransactionsRepository } from "../../transactions/repositories/itransactions-repository";
import { IStatementFileParser } from "../providers/istatement-file-parser";
import { StatementFileFormat } from "../entities/statement-import";
import { UnsupportedFileFormatError } from "./errors/unsupported-file-format-error";
import { FileTooLargeError } from "./errors/file-too-large-error";
import { StatementExtractionFailedError } from "./errors/statement-extraction-failed-error";

type ImportStatementUseCaseRequest = {
  fileName: string;
  fileFormat: StatementFileFormat | null;
  fileBuffer: Buffer;
  userId: string;
};

// Remove marcas diacríticas (acentos) combinadas após normalização Unicode NFD —
// intervalo U+0300–U+036F (Combining Diacritical Marks).
const DIACRITICS_PATTERN = new RegExp(
  `[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`,
  "g",
);

function normalizeDescription(description: string): string {
  return description
    .normalize("NFD")
    .replace(DIACRITICS_PATTERN, "")
    .trim()
    .toLowerCase();
}

export class ImportStatementUseCase {
  constructor(
    private statementImportsRepository: IStatementImportsRepository,
    private extractedTransactionsRepository: IExtractedTransactionsRepository,
    private categoriesRepository: ICategoriesRepository,
    private transactionsRepository: ITransactionsRepository,
    private statementFileParser: IStatementFileParser,
    private maxFileSizeBytes: number,
  ) {}

  async execute({
    fileName,
    fileFormat,
    fileBuffer,
    userId,
  }: ImportStatementUseCaseRequest) {
    if (!fileFormat) {
      throw new UnsupportedFileFormatError();
    }

    if (fileBuffer.byteLength > this.maxFileSizeBytes) {
      throw new FileTooLargeError(this.maxFileSizeBytes);
    }

    const statementImport = await this.statementImportsRepository.create({
      fileName,
      fileFormat,
      fileContent: fileBuffer,
      userId,
    });

    const categories = await this.categoriesRepository.findMany();

    let result;
    try {
      result = await this.statementFileParser.parse(
        fileBuffer,
        fileFormat,
        categories.map((category) => category.name),
      );
    } catch (error) {
      await this.statementImportsRepository.update(statementImport.id, {
        status: "FAILED",
        failureReason:
          error instanceof Error ? error.message : "Erro desconhecido.",
      });
      throw new StatementExtractionFailedError();
    }

    if (result.transactions.length === 0) {
      const updatedStatementImport = await this.statementImportsRepository.update(
        statementImport.id,
        { status: "NO_TRANSACTIONS_FOUND", extractionMethod: result.method },
      );
      return { statementImport: updatedStatementImport, extractedTransactions: [] };
    }

    const existingTransactions =
      await this.transactionsRepository.findManyForDuplicateCheck(
        userId,
        result.transactions.map((transaction) => ({
          date: transaction.date,
          amount: transaction.amount,
          description: transaction.description,
        })),
      );

    const extractedTransactions = await this.extractedTransactionsRepository.createMany(
      statementImport.id,
      result.transactions.map((transaction) => {
        const matchingCategory = transaction.suggestedCategoryName
          ? categories.find(
              (category) =>
                category.name.toLowerCase() ===
                transaction.suggestedCategoryName?.toLowerCase(),
            )
          : undefined;

        const isDuplicate = existingTransactions.some(
          (existingTransaction) =>
            existingTransaction.date.getTime() ===
              new Date(transaction.date).getTime() &&
            Number(existingTransaction.amount) === transaction.amount &&
            normalizeDescription(existingTransaction.description) ===
              normalizeDescription(transaction.description),
        );

        return {
          date: transaction.date,
          description: transaction.description,
          amount: transaction.amount,
          type: transaction.type,
          categoryId: matchingCategory?.id ?? null,
          isDuplicate,
        };
      }),
    );

    const updatedStatementImport = await this.statementImportsRepository.update(
      statementImport.id,
      { status: "READY_FOR_REVIEW", extractionMethod: result.method },
    );

    return { statementImport: updatedStatementImport, extractedTransactions };
  }
}
