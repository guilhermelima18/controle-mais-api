import { IRecurringTransactionsRepository } from "../repositories/irecurring-transactions-repository";
import { ICategoriesRepository } from "../../categories/repositories/icategories-repository";
import { TransactionType } from "../../transactions/entities/transaction";
import { RecurringTransactionFrequency } from "../entities/recurring-transaction";
import { CategoryNotFoundError } from "./errors/category-not-found-error";
import { InvalidEndDateError } from "./errors/invalid-end-date-error";

type CreateRecurringTransactionUseCaseRequest = {
  description: string;
  amount: number;
  type: TransactionType;
  frequency: RecurringTransactionFrequency;
  startDate: string;
  endDate?: string;
  userId: string;
  categoryId: string;
};

export class CreateRecurringTransactionUseCase {
  constructor(
    private recurringTransactionsRepository: IRecurringTransactionsRepository,
    private categoriesRepository: ICategoriesRepository,
  ) {}

  async execute(data: CreateRecurringTransactionUseCaseRequest) {
    const category = await this.categoriesRepository.findById(
      data.categoryId,
    );

    if (!category) {
      throw new CategoryNotFoundError();
    }

    if (data.endDate && new Date(data.endDate) <= new Date(data.startDate)) {
      throw new InvalidEndDateError();
    }

    return this.recurringTransactionsRepository.create(data);
  }
}
