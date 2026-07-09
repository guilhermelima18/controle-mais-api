"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Category = void 0;
class Category {
    constructor(props) {
        this.props = props;
    }
    get id() {
        return this.props.id;
    }
    get name() {
        return this.props.name;
    }
    get type() {
        return this.props.type;
    }
    toJSON() {
        return {
            id: this.props.id,
            name: this.props.name,
            type: this.props.type,
        };
    }
}
exports.Category = Category;
