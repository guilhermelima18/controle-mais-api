import { IRecurringTransactionsRepository } from "../repositories/irecurring-transactions-repository";

type FetchRecurringTransactionsUseCaseRequest = {
  userId: string;
};

export class FetchRecurringTransactionsUseCase {
  constructor(
    private recurringTransactionsRepository: IRecurringTransactionsRepository,
  ) {}

  async execute({ userId }: FetchRecurringTransactionsUseCaseRequest) {
    return this.recurringTransactionsRepository.findManyByUser(userId);
  }
}
