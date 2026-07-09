"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAlreadyExistsError = void 0;
const app_error_1 = require("../../../../core/errors/app-error");
class UserAlreadyExistsError extends app_error_1.AppError {
    constructor() {
        super("Esse usuário já existe!", 401);
    }
}
exports.UserAlreadyExistsError = UserAlreadyExistsError;
