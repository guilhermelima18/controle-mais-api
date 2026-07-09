import { ITransactionsRepository } from "../repositories/itransactions-repository";
import { TransactionType } from "../entities/transaction";

type FetchTransactionsByFiltersUseCaseRequest = {
  type?: string;
  categoryId?: string;
  search?: string;
  initialDate?: string;
  finalDate?: string;
  userId: string;
  page?: number;
  perPage?: number;
};

export class FetchTransactionsByFiltersUseCase {
  constructor(private transactionsRepository: ITransactionsRepository) {}

  async execute({
    type,
    categoryId,
    search,
    initialDate,
    finalDate,
    userId,
    page = 1,
    perPage = 3,
  }: FetchTransactionsByFiltersUseCaseRequest) {
    const transactionType: TransactionType | undefined =
      type === "EXPENSE"
        ? "EXPENSE"
        : type === "INCOME"
          ? "INCOME"
          : undefined;

    const dateFrom = initialDate ? new Date(initialDate) : undefined;
    if (dateFrom) dateFrom.setUTCHours(0, 0, 0, 0);

    const dateTo = finalDate ? new Date(finalDate) : undefined;
    if (dateTo) dateTo.setUTCHours(23, 59, 59, 999);

    return this.transactionsRepository.findManyByFilters({
      userId,
      type: transactionType,
      categoryId,
      search,
      dateFrom,
      dateTo,
      page,
      perPage,
    });
  }
}
