import {
  RecurringTransaction,
  RecurringTransactionFrequency,
} from "../entities/recurring-transaction";
import { TransactionType } from "../../transactions/entities/transaction";

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

export interface IRecurringTransactionsRepository {
  create(
    data: RecurringTransactionCreateData,
  ): Promise<RecurringTransaction>;
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
