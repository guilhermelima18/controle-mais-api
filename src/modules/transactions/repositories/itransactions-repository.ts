import { Transaction, TransactionType } from "../entities/transaction";

export type TransactionCreateData = {
  description: string;
  amount: number;
  type: TransactionType;
  date: string;
  userId: string;
  categoryId: string;
  recurringTransactionId?: string | null;
};

export type TransactionUpdateData = {
  description?: string;
  amount?: number;
  type?: TransactionType;
  date?: string;
  categoryId?: string;
};

export type TransactionFiltersQuery = {
  userId: string;
  type?: TransactionType;
  categoryId?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page: number;
  perPage: number;
};

export type TransactionFiltersResult = {
  data: Transaction[];
  meta: {
    totalItems: number;
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
  };
};

export interface ITransactionsRepository {
  create(data: TransactionCreateData): Promise<Transaction>;
  update(
    transactionId: string,
    data: TransactionUpdateData,
  ): Promise<Transaction>;
  delete(transactionId: string): Promise<void>;
  findById(transactionId: string): Promise<Transaction | null>;
  findByIdAndUser(
    transactionId: string,
    userId: string,
  ): Promise<Transaction | null>;
  findManyByFilters(
    query: TransactionFiltersQuery,
  ): Promise<TransactionFiltersResult>;
  findManyForDashboard(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Transaction[]>;
}
