import { StatementExtractionMethod, StatementFileFormat } from "../entities/statement-import";
import { TransactionType } from "../../transactions/entities/transaction";

export type ParsedTransaction = {
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  suggestedCategoryName?: string;
};

export type StatementFileParserResult = {
  transactions: ParsedTransaction[];
  method: StatementExtractionMethod;
};

export interface IStatementFileParser {
  parse(
    fileBuffer: Buffer,
    format: StatementFileFormat,
    existingCategoryNames: string[],
  ): Promise<StatementFileParserResult>;
}
