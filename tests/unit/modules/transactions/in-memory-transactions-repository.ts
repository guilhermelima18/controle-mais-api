import { randomUUID } from "node:crypto";
import { Decimal } from "@prisma/client/runtime/client";
import { Transaction } from "../../../../src/modules/transactions/entities/transaction";
import {
  ITransactionsRepository,
  TransactionCreateData,
  TransactionFiltersQuery,
  TransactionFiltersResult,
  TransactionUpdateData,
} from "../../../../src/modules/transactions/repositories/itransactions-repository";

export class InMemoryTransactionsRepository implements ITransactionsRepository {
  public items: Transaction[] = [];

  async create(data: TransactionCreateData): Promise<Transaction> {
    const transaction = new Transaction({
      id: randomUUID(),
      description: data.description,
      amount: new Decimal(data.amount),
      type: data.type,
      date: new Date(data.date),
      userId: data.userId,
      categoryId: data.categoryId,
      recurringTransactionId: data.recurringTransactionId ?? null,
      createdAt: new Date(),
    });

    this.items.push(transaction);
    return transaction;
  }

  async update(
    transactionId: string,
    data: TransactionUpdateData,
  ): Promise<Transaction> {
    const index = this.items.findIndex((item) => item.id === transactionId);
    if (index === -1) {
      throw new Error("Transaction not found.");
    }

    const current = this.items[index];
    const updated = new Transaction({
      id: current.id,
      description: data.description ?? current.description,
      amount:
        data.amount !== undefined ? new Decimal(data.amount) : current.amount,
      type: data.type ?? current.type,
      date: data.date ? new Date(data.date) : current.date,
      userId: current.userId,
      categoryId: data.categoryId ?? current.categoryId,
      recurringTransactionId: current.recurringTransactionId,
      createdAt: current.createdAt,
    });

    this.items[index] = updated;
    return updated;
  }

  async delete(transactionId: string): Promise<void> {
    this.items = this.items.filter((item) => item.id !== transactionId);
  }

  async findById(transactionId: string): Promise<Transaction | null> {
    return this.items.find((item) => item.id === transactionId) ?? null;
  }

  async findByIdAndUser(
    transactionId: string,
    userId: string,
  ): Promise<Transaction | null> {
    return (
      this.items.find(
        (item) => item.id === transactionId && item.userId === userId,
      ) ?? null
    );
  }

  async findManyByFilters({
    userId,
    type,
    categoryId,
    search,
    dateFrom,
    dateTo,
    page,
    perPage,
  }: TransactionFiltersQuery): Promise<TransactionFiltersResult> {
    const filtered = this.items.filter((item) => {
      if (item.userId !== userId) return false;
      if (type && item.type !== type) return false;
      if (categoryId && item.categoryId !== categoryId) return false;
      if (
        search &&
        !item.description.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      if (dateFrom && item.date < dateFrom) return false;
      if (dateTo && item.date > dateTo) return false;
      return true;
    });

    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / perPage);
    const data = filtered.slice((page - 1) * perPage, page * perPage);

    return {
      data,
      meta: {
        totalItems,
        currentPage: page,
        totalPages,
        itemsPerPage: perPage,
      },
    };
  }

  async findManyForDashboard(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Transaction[]> {
    return this.items.filter(
      (item) =>
        item.userId === userId &&
        item.date >= startDate &&
        item.date < endDate,
    );
  }
}
