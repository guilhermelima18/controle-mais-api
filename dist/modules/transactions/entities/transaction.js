"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = void 0;
class Transaction {
    constructor(props) {
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
    get extractedTransactionId() {
        return this.props.extractedTransactionId;
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
            extractedTransactionId: this.props.extractedTransactionId,
            createdAt: this.props.createdAt,
            category: this.props.category,
        };
    }
}
exports.Transaction = Transaction;
