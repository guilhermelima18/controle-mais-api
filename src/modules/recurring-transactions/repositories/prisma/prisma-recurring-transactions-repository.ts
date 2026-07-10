import { prisma } from "../../../../infra/database/prisma";
import { RecurringTransaction } from "../../entities/recurring-transaction";
import {
  IRecurringTransactionsRepository,
  RecurringTransactionCreateData,
  RecurringTransactionUpdateData,
} from "../irecurring-transactions-repository";

export class PrismaRecurringTransactionsRepository
  implements IRecurringTransactionsRepository
{
  async create(
    data: RecurringTransactionCreateData,
  ): Promise<RecurringTransaction> {
    const recurringTransaction = await prisma.recurringTransaction.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : data.endDate,
      },
    });
    return new RecurringTransaction(recurringTransaction);
  }

  async update(
    recurringTransactionId: string,
    data: RecurringTransactionUpdateData,
  ): Promise<RecurringTransaction> {
    const recurringTransaction = await prisma.recurringTransaction.update({
      where: { id: recurringTransactionId },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : data.endDate,
      },
    });
    return new RecurringTransaction(recurringTransaction);
  }

  async delete(recurringTransactionId: string): Promise<void> {
    await prisma.recurringTransaction.delete({
      where: { id: recurringTransactionId },
    });
  }

  async findByIdAndUser(
    recurringTransactionId: string,
    userId: string,
  ): Promise<RecurringTransaction | null> {
    const recurringTransaction = await prisma.recurringTransaction.findUnique(
      {
        where: { id: recurringTransactionId, userId },
      },
    );
    return recurringTransaction
      ? new RecurringTransaction(recurringTransaction)
      : null;
  }

  async findManyByUser(userId: string): Promise<RecurringTransaction[]> {
    const recurringTransactions = await prisma.recurringTransaction.findMany({
      where: { userId },
    });
    return recurringTransactions.map(
      (recurringTransaction) => new RecurringTransaction(recurringTransaction),
    );
  }

  async findManyDue(referenceDate: Date): Promise<RecurringTransaction[]> {
    // Não filtramos por endDate aqui: uma recorrência já encerrada pode ainda ter
    // ciclos pendentes de backfill dentro da sua janela válida (FR-014). Quem decide
    // se há algo a gerar é `calculateDueCycles`, não esta query.
    const recurringTransactions = await prisma.recurringTransaction.findMany({
      where: {
        startDate: { lte: referenceDate },
      },
    });
    return recurringTransactions.map(
      (recurringTransaction) => new RecurringTransaction(recurringTransaction),
    );
  }

  async updateLastGeneratedDate(
    recurringTransactionId: string,
    lastGeneratedDate: Date,
  ): Promise<void> {
    await prisma.recurringTransaction.update({
      where: { id: recurringTransactionId },
      data: { lastGeneratedDate },
    });
  }
}
