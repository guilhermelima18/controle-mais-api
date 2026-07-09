"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceNotFoundError = void 0;
const app_error_1 = require("./app-error");
class ResourceNotFoundError extends app_error_1.AppError {
    constructor(message) {
        super(message, 404);
    }
}
exports.ResourceNotFoundError = ResourceNotFoundError;
