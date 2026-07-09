"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryNotFoundError = void 0;
const app_error_1 = require("../../../../core/errors/app-error");
class CategoryNotFoundError extends app_error_1.AppError {
    constructor() {
        super("Essa categoria não existe!", 404);
    }
}
exports.CategoryNotFoundError = CategoryNotFoundError;
