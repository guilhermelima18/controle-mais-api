import { IStatementImportsRepository } from "../repositories/istatement-imports-repository";
import {
  ExtractedTransactionUpdateData,
  IExtractedTransactionsRepository,
} from "../repositories/iextracted-transactions-repository";
import { ICategoriesRepository } from "../../categories/repositories/icategories-repository";
import { ResourceNotFoundError } from "../../../core/errors/resource-not-found-error";
import { StatementImportAlreadyConfirmedError } from "./errors/statement-import-already-confirmed-error";
import { CategoryNotFoundError } from "./errors/category-not-found-error";

type UpdateExtractedTransactionUseCaseRequest = {
  statementImportId: string;
  extractedTransactionId: string;
  userId: string;
  data: ExtractedTransactionUpdateData;
};

export class UpdateExtractedTransactionUseCase {
  constructor(
    private statementImportsRepository: IStatementImportsRepository,
    private extractedTransactionsRepository: IExtractedTransactionsRepository,
    private categoriesRepository: ICategoriesRepository,
  ) {}

  async execute({
    statementImportId,
    extractedTransactionId,
    userId,
    data,
  }: UpdateExtractedTransactionUseCaseRequest) {
    const statementImport = await this.statementImportsRepository.findByIdAndUser(
      statementImportId,
      userId,
    );

    if (!statementImport) {
      throw new ResourceNotFoundError("Esta importação não existe!");
    }

    if (statementImport.status === "CONFIRMED") {
      throw new StatementImportAlreadyConfirmedError();
    }

    const extractedTransaction =
      await this.extractedTransactionsRepository.findByIdAndStatementImport(
        extractedTransactionId,
        statementImportId,
      );

    if (!extractedTransaction) {
      throw new ResourceNotFoundError("Esta transação extraída não existe!");
    }

    if (data.categoryId) {
      const category = await this.categoriesRepository.findById(data.categoryId);
      if (!category) {
        throw new CategoryNotFoundError();
      }
    }

    return this.extractedTransactionsRepository.update(extractedTransactionId, data);
  }
}
