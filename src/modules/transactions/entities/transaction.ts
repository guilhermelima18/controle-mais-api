import type { Decimal } from "@prisma/client/runtime/client";

export type TransactionType = "INCOME" | "EXPENSE";

export interface TransactionCategory {
  id: string;
  name: string;
  type: TransactionType;
}

export interface TransactionProps {
  id: string;
  description: string;
  amount: Decimal;
  type: TransactionType;
  date: Date;
  userId: string;
  categoryId: string;
  recurringTransactionId: string | null;
  createdAt: Date;
  category?: TransactionCategory;
}

export class Transaction {
  private props: TransactionProps;

  constructor(props: TransactionProps) {
    this.props = props;
  }

  get id() {
    return this.props.id;
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

  get date() {
    return this.props.date;
  }

  get userId() {
    return this.props.userId;
  }

  get categoryId() {
    return this.props.categoryId;
  }

  get recurringTransactionId() {
    return this.props.recurringTransactionId;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get category() {
    return this.props.category;
  }

  toJSON() {
    return {
      id: this.props.id,
      description: this.props.description,
      amount: this.props.amount,
      type: this.props.type,
      date: this.props.date,
      userId: this.props.userId,
      categoryId: this.props.categoryId,
      recurringTransactionId: this.props.recurringTransactionId,
      createdAt: this.props.createdAt,
      category: this.props.category,
    };
  }
}
