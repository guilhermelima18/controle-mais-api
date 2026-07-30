import { IRecurringTransactionsRepository } from "../repositories/irecurring-transactions-repository";
import { ICategoriesRepository } from "../../categories/repositories/icategories-repository";
import { TransactionType } from "../../transactions/entities/transaction";
import { RecurringTransactionFrequency } from "../entities/recurring-transaction";
import { CategoryNotFoundError } from "./errors/category-not-found-error";
import { InvalidEndDateError } from "./errors/invalid-end-date-error";
import { calculateDueCycles } from "./calculate-due-cycles";

type CreateRecurringTransactionUseCaseRequest = {
  description: string;
  amount: number;
  type: TransactionType;
  frequency: RecurringTransactionFrequency;
  startDate: string;
  endDate?: string;
  userId: string;
  categoryId: string;
  referenceDate?: Date;
};

export class CreateRecurringTransactionUseCase {
  constructor(
    private recurringTransactionsRepository: IRecurringTransactionsRepository,
    private categoriesRepository: ICategoriesRepository,
  ) {}

  async execute({
    referenceDate = new Date(),
    ...data
  }: CreateRecurringTransactionUseCaseRequest) {
    const category = await this.categoriesRepository.findById(
      data.categoryId,
    );

    if (!category) {
      throw new CategoryNotFoundError();
    }

    if (data.endDate && new Date(data.endDate) <= new Date(data.startDate)) {
      throw new InvalidEndDateError();
    }

    // Antecipamos aqui os ciclos que o job geraria na próxima execução, para que o
    // lançamento apareça no extrato na hora (FR-001 da 003). `lastGeneratedDate` é
    // null porque a recorrência ainda não existe — a mesma função usada pelo job
    // decide quais ciclos são devidos, o que garante a paridade exigida pelo FR-002.
    const dueCycles = calculateDueCycles({
      startDate: new Date(data.startDate),
      lastGeneratedDate: null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      frequency: data.frequency,
      referenceDate,
    });

    return this.recurringTransactionsRepository.createWithDueTransactions(
      data,
      dueCycles,
    );
  }
}
