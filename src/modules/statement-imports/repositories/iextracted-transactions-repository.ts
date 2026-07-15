import { ExtractedTransaction } from "../entities/extracted-transaction";
import { TransactionType } from "../../transactions/entities/transaction";

export type ExtractedTransactionCreateData = {
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  categoryId?: string | null;
  isDuplicate?: boolean;
};

export type ExtractedTransactionUpdateData = {
  date?: string;
  description?: string;
  amount?: number;
  type?: TransactionType;
  categoryId?: string | null;
  discarded?: boolean;
};

export interface IExtractedTransactionsRepository {
  createMany(
    statementImportId: string,
    items: ExtractedTransactionCreateData[],
  ): Promise<ExtractedTransaction[]>;
  findManyByStatementImport(
    statementImportId: string,
  ): Promise<ExtractedTransaction[]>;
  findByIdAndStatementImport(
    extractedTransactionId: string,
    statementImportId: string,
  ): Promise<ExtractedTransaction | null>;
  update(
    extractedTransactionId: string,
    data: ExtractedTransactionUpdateData,
  ): Promise<ExtractedTransaction>;
}
