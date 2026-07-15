import { IStatementImportsRepository } from "../repositories/istatement-imports-repository";
import { IExtractedTransactionsRepository } from "../repositories/iextracted-transactions-repository";
import { ResourceNotFoundError } from "../../../core/errors/resource-not-found-error";
import { StatementImportAlreadyConfirmedError } from "./errors/statement-import-already-confirmed-error";

type DiscardExtractedTransactionUseCaseRequest = {
  statementImportId: string;
  extractedTransactionId: string;
  userId: string;
};

export class DiscardExtractedTransactionUseCase {
  constructor(
    private statementImportsRepository: IStatementImportsRepository,
    private extractedTransactionsRepository: IExtractedTransactionsRepository,
  ) {}

  async execute({
    statementImportId,
    extractedTransactionId,
    userId,
  }: DiscardExtractedTransactionUseCaseRequest) {
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

    await this.extractedTransactionsRepository.update(extractedTransactionId, {
      discarded: true,
    });
  }
}
