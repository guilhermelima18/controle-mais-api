import { IRecurringTransactionsRepository } from "../repositories/irecurring-transactions-repository";
import { ResourceNotFoundError } from "../../../core/errors/resource-not-found-error";

type DeleteRecurringTransactionUseCaseRequest = {
  recurringTransactionId: string;
  userId: string;
};

export class DeleteRecurringTransactionUseCase {
  constructor(
    private recurringTransactionsRepository: IRecurringTransactionsRepository,
  ) {}

  async execute({
    recurringTransactionId,
    userId,
  }: DeleteRecurringTransactionUseCaseRequest) {
    const recurringTransaction =
      await this.recurringTransactionsRepository.findByIdAndUser(
        recurringTransactionId,
        userId,
      );

    if (!recurringTransaction) {
      throw new ResourceNotFoundError("Essa recorrência não existe!");
    }

    await this.recurringTransactionsRepository.delete(recurringTransactionId);
  }
}
