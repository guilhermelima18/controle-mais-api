import { randomUUID } from "node:crypto";
import { Decimal } from "@prisma/client/runtime/client";
import { RecurringTransaction } from "../../../../src/modules/recurring-transactions/entities/recurring-transaction";
import { Transaction } from "../../../../src/modules/transactions/entities/transaction";
import {
  IRecurringTransactionsRepository,
  RecurringTransactionCreateData,
  RecurringTransactionUpdateData,
  RecurringTransactionWithDueTransactions,
} from "../../../../src/modules/recurring-transactions/repositories/irecurring-transactions-repository";
import { InMemoryTransactionsRepository } from "../transactions/in-memory-transactions-repository";

export class InMemoryRecurringTransactionsRepository
  implements IRecurringTransactionsRepository
{
  public items: RecurringTransaction[] = [];

  // A implementação Prisma materializa recorrência + transações numa única transação
  // de banco. Aqui o equivalente é escrever nas duas coleções in-memory; o repositório
  // de transações é injetado para que o teste possa asseverar sobre os dois lados.
  constructor(
    public transactionsRepository: InMemoryTransactionsRepository = new InMemoryTransactionsRepository(),
  ) {}

  async create(
    data: RecurringTransactionCreateData,
  ): Promise<RecurringTransaction> {
    const now = new Date();
    const recurringTransaction = new RecurringTransaction({
      id: randomUUID(),
      description: data.description,
      amount: new Decimal(data.amount),
      type: data.type,
      frequency: data.frequency,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      lastGeneratedDate: null,
      userId: data.userId,
      categoryId: data.categoryId,
      createdAt: now,
      updatedAt: now,
    });

    this.items.push(recurringTransaction);
    return recurringTransaction;
  }

  async createWithDueTransactions(
    data: RecurringTransactionCreateData,
    dueCycles: Date[],
  ): Promise<RecurringTransactionWithDueTransactions> {
    const recurringTransaction = await this.create(data);

    const createdTransactions: Transaction[] = [];

    for (const cycleDate of dueCycles) {
      createdTransactions.push(
        await this.transactionsRepository.create({
          description: recurringTransaction.description,
          amount: Number(recurringTransaction.amount),
          type: recurringTransaction.type,
          date: cycleDate.toISOString(),
          userId: recurringTransaction.userId,
          categoryId: recurringTransaction.categoryId,
          recurringTransactionId: recurringTransaction.id,
        }),
      );
    }

    if (dueCycles.length > 0) {
      await this.updateLastGeneratedDate(
        recurringTransaction.id,
        dueCycles[dueCycles.length - 1],
      );
    }

    return {
      recurringTransaction:
        (await this.findByIdAndUser(
          recurringTransaction.id,
          recurringTransaction.userId,
        )) ?? recurringTransaction,
      createdTransactions,
    };
  }

  async update(
    recurringTransactionId: string,
    data: RecurringTransactionUpdateData,
  ): Promise<RecurringTransaction> {
    const index = this.items.findIndex(
      (item) => item.id === recurringTransactionId,
    );
    if (index === -1) {
      throw new Error("RecurringTransaction not found.");
    }

    const current = this.items[index];
    const updated = new RecurringTransaction({
      id: current.id,
      description: data.description ?? current.description,
      amount:
        data.amount !== undefined ? new Decimal(data.amount) : current.amount,
      type: data.type ?? current.type,
      frequency: data.frequency ?? current.frequency,
      startDate: data.startDate ? new Date(data.startDate) : current.startDate,
      endDate:
        data.endDate !== undefined
          ? data.endDate
            ? new Date(data.endDate)
            : null
          : current.endDate,
      lastGeneratedDate: current.lastGeneratedDate,
      userId: current.userId,
      categoryId: data.categoryId ?? current.categoryId,
      createdAt: current.createdAt,
      updatedAt: new Date(),
    });

    this.items[index] = updated;
    return updated;
  }

  async delete(recurringTransactionId: string): Promise<void> {
    this.items = this.items.filter(
      (item) => item.id !== recurringTransactionId,
    );
  }

  async findByIdAndUser(
    recurringTransactionId: string,
    userId: string,
  ): Promise<RecurringTransaction | null> {
    return (
      this.items.find(
        (item) => item.id === recurringTransactionId && item.userId === userId,
      ) ?? null
    );
  }

  async findManyByUser(userId: string): Promise<RecurringTransaction[]> {
    return this.items.filter((item) => item.userId === userId);
  }

  async findManyDue(referenceDate: Date): Promise<RecurringTransaction[]> {
    // Não filtramos por endDate aqui pelo mesmo motivo do repository Prisma: ver
    // o comentário em prisma-recurring-transactions-repository.ts.
    return this.items.filter((item) => item.startDate <= referenceDate);
  }

  async updateLastGeneratedDate(
    recurringTransactionId: string,
    lastGeneratedDate: Date,
  ): Promise<void> {
    const index = this.items.findIndex(
      (item) => item.id === recurringTransactionId,
    );
    if (index === -1) {
      throw new Error("RecurringTransaction not found.");
    }

    const current = this.items[index];
    this.items[index] = new RecurringTransaction({
      id: current.id,
      description: current.description,
      amount: current.amount,
      type: current.type,
      frequency: current.frequency,
      startDate: current.startDate,
      endDate: current.endDate,
      lastGeneratedDate,
      userId: current.userId,
      categoryId: current.categoryId,
      createdAt: current.createdAt,
      updatedAt: new Date(),
    });
  }
}
