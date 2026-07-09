"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
class User {
    constructor(props) {
        this.props = props;
    }
    get id() {
        return this.props.id;
    }
    get name() {
        return this.props.name;
    }
    get cpf() {
        return this.props.cpf;
    }
    get email() {
        return this.props.email;
    }
    get password() {
        return this.props.password;
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
            name: this.props.name,
            cpf: this.props.cpf,
            email: this.props.email,
            createdAt: this.props.createdAt,
            updatedAt: this.props.updatedAt,
        };
    }
}
exports.User = User;
