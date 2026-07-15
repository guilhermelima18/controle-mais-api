import { IStatementImportsRepository } from "../repositories/istatement-imports-repository";
import { IExtractedTransactionsRepository } from "../repositories/iextracted-transactions-repository";
import { ITransactionsRepository } from "../../transactions/repositories/itransactions-repository";
import { Transaction } from "../../transactions/entities/transaction";
import { ResourceNotFoundError } from "../../../core/errors/resource-not-found-error";
import { StatementImportAlreadyConfirmedError } from "./errors/statement-import-already-confirmed-error";
import { MissingCategoryForConfirmationError } from "./errors/missing-category-for-confirmation-error";

type ConfirmStatementImportUseCaseRequest = {
  statementImportId: string;
  userId: string;
};

export class ConfirmStatementImportUseCase {
  constructor(
    private statementImportsRepository: IStatementImportsRepository,
    private extractedTransactionsRepository: IExtractedTransactionsRepository,
    private transactionsRepository: ITransactionsRepository,
  ) {}

  async execute({ statementImportId, userId }: ConfirmStatementImportUseCaseRequest) {
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

    const extractedTransactions =
      await this.extractedTransactionsRepository.findManyByStatementImport(
        statementImportId,
      );

    const pendingTransactions = extractedTransactions.filter(
      (extractedTransaction) => !extractedTransaction.discarded,
    );

    const missingCategoryIds = pendingTransactions
      .filter((extractedTransaction) => !extractedTransaction.categoryId)
      .map((extractedTransaction) => extractedTransaction.id);

    if (missingCategoryIds.length > 0) {
      throw new MissingCategoryForConfirmationError(missingCategoryIds);
    }

    const createdTransactions: Transaction[] = [];
    for (const extractedTransaction of pendingTransactions) {
      const transaction = await this.transactionsRepository.create({
        description: extractedTransaction.description,
        amount: Number(extractedTransaction.amount),
        type: extractedTransaction.type,
        date: extractedTransaction.date.toISOString(),
        userId,
        categoryId: extractedTransaction.categoryId as string,
        extractedTransactionId: extractedTransaction.id,
      });
      createdTransactions.push(transaction);
    }

    const updatedStatementImport = await this.statementImportsRepository.update(
      statementImportId,
      { status: "CONFIRMED", confirmedAt: new Date() },
    );

    return { statementImport: updatedStatementImport, createdTransactions };
  }
}
