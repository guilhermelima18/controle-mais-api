import {
  RecurringTransaction,
  RecurringTransactionFrequency,
} from "../entities/recurring-transaction";
import {
  Transaction,
  TransactionType,
} from "../../transactions/entities/transaction";

export type RecurringTransactionCreateData = {
  description: string;
  amount: number;
  type: TransactionType;
  frequency: RecurringTransactionFrequency;
  startDate: string;
  endDate?: string | null;
  userId: string;
  categoryId: string;
};

export type RecurringTransactionUpdateData = {
  description?: string;
  amount?: number;
  type?: TransactionType;
  frequency?: RecurringTransactionFrequency;
  startDate?: string;
  endDate?: string | null;
  categoryId?: string;
};

export type RecurringTransactionWithDueTransactions = {
  recurringTransaction: RecurringTransaction;
  createdTransactions: Transaction[];
};

export interface IRecurringTransactionsRepository {
  create(
    data: RecurringTransactionCreateData,
  ): Promise<RecurringTransaction>;
  /**
   * Cria a recorrência e materializa, na MESMA unidade atômica, uma transação por
   * ciclo em `dueCycles`, além de avançar `lastGeneratedDate` para o último ciclo.
   * Atomicidade é requisito (FR-007 da 003): uma falha parcial que criasse transações
   * sem avançar `lastGeneratedDate` faria o job duplicá-las na execução seguinte.
   * `dueCycles` vazio cria apenas a recorrência e não toca em `lastGeneratedDate`.
   */
  createWithDueTransactions(
    data: RecurringTransactionCreateData,
    dueCycles: Date[],
  ): Promise<RecurringTransactionWithDueTransactions>;
  update(
    recurringTransactionId: string,
    data: RecurringTransactionUpdateData,
  ): Promise<RecurringTransaction>;
  delete(recurringTransactionId: string): Promise<void>;
  findByIdAndUser(
    recurringTransactionId: string,
    userId: string,
  ): Promise<RecurringTransaction | null>;
  findManyByUser(userId: string): Promise<RecurringTransaction[]>;
  findManyDue(referenceDate: Date): Promise<RecurringTransaction[]>;
  updateLastGeneratedDate(
    recurringTransactionId: string,
    lastGeneratedDate: Date,
  ): Promise<void>;
}
