import type { Decimal } from "@prisma/client/runtime/client";
import type { TransactionType } from "../../transactions/entities/transaction";

export interface ExtractedTransactionProps {
  id: string;
  date: Date;
  description: string;
  amount: Decimal;
  type: TransactionType;
  isDuplicate: boolean;
  discarded: boolean;
  statementImportId: string;
  categoryId: string | null;
  createdAt: Date;
}

export class ExtractedTransaction {
  private props: ExtractedTransactionProps;

  constructor(props: ExtractedTransactionProps) {
    this.props = props;
  }

  get id() {
    return this.props.id;
  }

  get date() {
    return this.props.date;
  }

  get description() {
    return this.props.description;
  }

  get amount() {
    return this.props.amount;
  }

  get type() {
    return this.props.type;
  }

  get isDuplicate() {
    return this.props.isDuplicate;
  }

  get discarded() {
    return this.props.discarded;
  }

  get statementImportId() {
    return this.props.statementImportId;
  }

  get categoryId() {
    return this.props.categoryId;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  toJSON() {
    return {
      id: this.props.id,
      date: this.props.date,
      description: this.props.description,
      amount: this.props.amount,
      type: this.props.type,
      isDuplicate: this.props.isDuplicate,
      discarded: this.props.discarded,
      statementImportId: this.props.statementImportId,
      categoryId: this.props.categoryId,
      createdAt: this.props.createdAt,
    };
  }
}
