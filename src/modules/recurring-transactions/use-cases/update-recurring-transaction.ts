import { IRecurringTransactionsRepository } from "../repositories/irecurring-transactions-repository";
import { ICategoriesRepository } from "../../categories/repositories/icategories-repository";
import { ResourceNotFoundError } from "../../../core/errors/resource-not-found-error";
import { CategoryNotFoundError } from "./errors/category-not-found-error";
import { InvalidEndDateError } from "./errors/invalid-end-date-error";
import { TransactionType } from "../../transactions/entities/transaction";
import { RecurringTransactionFrequency } from "../entities/recurring-transaction";

type UpdateRecurringTransactionUseCaseRequest = {
  recurringTransactionId: string;
  userId: string;
  data: {
    description?: string;
    amount?: number;
    type?: TransactionType;
    frequency?: RecurringTransactionFrequency;
    startDate?: string;
    endDate?: string;
    categoryId?: string;
  };
};

export class UpdateRecurringTransactionUseCase {
  constructor(
    private recurringTransactionsRepository: IRecurringTransactionsRepository,
    private categoriesRepository: ICategoriesRepository,
  ) {}

  async execute({
    recurringTransactionId,
    userId,
    data,
  }: UpdateRecurringTransactionUseCaseRequest) {
    const recurringTransaction =
      await this.recurringTransactionsRepository.findByIdAndUser(
        recurringTransactionId,
        userId,
      );

    if (!recurringTransaction) {
      throw new ResourceNotFoundError("Essa recorrência não existe!");
    }

    if (data.categoryId) {
      const category = await this.categoriesRepository.findById(
        data.categoryId,
      );

      if (!category) {
        throw new CategoryNotFoundError();
      }
    }

    const startDate = data.startDate ?? recurringTransaction.startDate.toISOString();
    const endDate = data.endDate ?? recurringTransaction.endDate?.toISOString();

    if (endDate && new Date(endDate) <= new Date(startDate)) {
      throw new InvalidEndDateError();
    }

    return this.recurringTransactionsRepository.update(
      recurringTransactionId,
      data,
    );
  }
}
