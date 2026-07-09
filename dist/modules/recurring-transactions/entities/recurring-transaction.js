"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecurringTransaction = void 0;
class RecurringTransaction {
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
    get frequency() {
        return this.props.frequency;
    }
    get startDate() {
        return this.props.startDate;
    }
    get endDate() {
        return this.props.endDate;
    }
    get lastGeneratedDate() {
        return this.props.lastGeneratedDate;
    }
    get userId() {
        return this.props.userId;
    }
    get categoryId() {
        return this.props.categoryId;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    toJSON() {
        return {
            id: this.props.id,
            description: this.props.description,
            amount: this.props.amount,
            type: this.props.type,
            frequency: this.props.frequency,
            startDate: this.props.startDate,
            endDate: this.props.endDate,
            lastGeneratedDate: this.props.lastGeneratedDate,
            userId: this.props.userId,
            categoryId: this.props.categoryId,
            createdAt: this.props.createdAt,
            updatedAt: this.props.updatedAt,
        };
    }
}
exports.RecurringTransaction = RecurringTransaction;
