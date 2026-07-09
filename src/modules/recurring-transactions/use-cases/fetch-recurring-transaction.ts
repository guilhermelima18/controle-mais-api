import { IRecurringTransactionsRepository } from "../repositories/irecurring-transactions-repository";
import { ResourceNotFoundError } from "../../../core/errors/resource-not-found-error";

type FetchRecurringTransactionUseCaseRequest = {
  recurringTransactionId: string;
  userId: string;
};

export class FetchRecurringTransactionUseCase {
  constructor(
    private recurringTransactionsRepository: IRecurringTransactionsRepository,
  ) {}

  async execute({
    recurringTransactionId,
    userId,
  }: FetchRecurringTransactionUseCaseRequest) {
    const recurringTransaction =
      await this.recurringTransactionsRepository.findByIdAndUser(
        recurringTransactionId,
        userId,
      );

    if (!recurringTransaction) {
      throw new ResourceNotFoundError("Essa recorrência não existe!");
    }

    return recurringTransaction;
  }
}
