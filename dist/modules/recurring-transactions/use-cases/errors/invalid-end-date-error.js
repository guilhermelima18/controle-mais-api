"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidEndDateError = void 0;
const app_error_1 = require("../../../../core/errors/app-error");
class InvalidEndDateError extends app_error_1.AppError {
    constructor() {
        super("A data de término deve ser posterior à data de início!", 400);
    }
}
exports.InvalidEndDateError = InvalidEndDateError;
