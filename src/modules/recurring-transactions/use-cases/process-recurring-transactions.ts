import { IRecurringTransactionsRepository } from "../repositories/irecurring-transactions-repository";
import { ITransactionsRepository } from "../../transactions/repositories/itransactions-repository";
import { calculateDueCycles } from "./calculate-due-cycles";

export class ProcessRecurringTransactionsUseCase {
  constructor(
    private recurringTransactionsRepository: IRecurringTransactionsRepository,
    private transactionsRepository: ITransactionsRepository,
  ) {}

  async execute(referenceDate: Date = new Date()) {
    const dueRecurringTransactions =
      await this.recurringTransactionsRepository.findManyDue(referenceDate);

    let generatedTransactionsCount = 0;

    for (const recurringTransaction of dueRecurringTransactions) {
      const cycles = calculateDueCycles({
        startDate: recurringTransaction.startDate,
        lastGeneratedDate: recurringTransaction.lastGeneratedDate,
        endDate: recurringTransaction.endDate,
        frequency: recurringTransaction.frequency,
        referenceDate,
      });

      if (cycles.length === 0) {
        continue;
      }

      for (const cycleDate of cycles) {
        await this.transactionsRepository.create({
          description: recurringTransaction.description,
          amount: Number(recurringTransaction.amount),
          type: recurringTransaction.type,
          date: cycleDate.toISOString(),
          userId: recurringTransaction.userId,
          categoryId: recurringTransaction.categoryId,
          recurringTransactionId: recurringTransaction.id,
        });
        generatedTransactionsCount++;
      }

      await this.recurringTransactionsRepository.updateLastGeneratedDate(
        recurringTransaction.id,
        cycles[cycles.length - 1],
      );
    }

    return { generatedTransactionsCount };
  }
}
