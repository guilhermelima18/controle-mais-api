"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidCredentialsError = void 0;
const app_error_1 = require("../../../../core/errors/app-error");
class InvalidCredentialsError extends app_error_1.AppError {
    constructor() {
        super("Usuário e/ou senha incorretos!", 401);
    }
}
exports.InvalidCredentialsError = InvalidCredentialsError;
