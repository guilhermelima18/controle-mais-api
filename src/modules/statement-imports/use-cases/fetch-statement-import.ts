import { IStatementImportsRepository } from "../repositories/istatement-imports-repository";
import { IExtractedTransactionsRepository } from "../repositories/iextracted-transactions-repository";
import { ResourceNotFoundError } from "../../../core/errors/resource-not-found-error";

type FetchStatementImportUseCaseRequest = {
  statementImportId: string;
  userId: string;
};

export class FetchStatementImportUseCase {
  constructor(
    private statementImportsRepository: IStatementImportsRepository,
    private extractedTransactionsRepository: IExtractedTransactionsRepository,
  ) {}

  async execute({ statementImportId, userId }: FetchStatementImportUseCaseRequest) {
    const statementImport = await this.statementImportsRepository.findByIdAndUser(
      statementImportId,
      userId,
    );

    if (!statementImport) {
      throw new ResourceNotFoundError("Esta importação não existe!");
    }

    const extractedTransactions =
      await this.extractedTransactionsRepository.findManyByStatementImport(
        statementImportId,
      );

    return { statementImport, extractedTransactions };
  }
}
