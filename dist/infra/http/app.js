"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const multipart_1 = __importDefault(require("@fastify/multipart"));
const env_1 = require("../../config/env");
const app_error_1 = require("../../core/errors/app-error");
const ensure_authenticated_1 = require("../@shared/middlewares/ensure-authenticated");
const routes_1 = require("../../modules/auth/infra/http/routes");
const routes_2 = require("../../modules/users/infra/http/routes");
const routes_3 = require("../../modules/categories/infra/http/routes");
const routes_4 = require("../../modules/transactions/infra/http/routes");
const routes_5 = require("../../modules/recurring-transactions/infra/http/routes");
const routes_6 = require("../../modules/statement-imports/infra/http/routes");
exports.app = (0, fastify_1.default)();
// Plugins
exports.app.register(cors_1.default);
exports.app.register(jwt_1.default, {
    secret: env_1.env.jwtSecret,
});
exports.app.register(multipart_1.default, {
    limits: { fileSize: env_1.env.statementImportMaxFileSizeBytes },
});
exports.app.decorate("authenticate", ensure_authenticated_1.ensureAuthenticated);
// Rotas
exports.app.register(routes_1.authRoutes, { prefix: "/v1/auth" });
exports.app.register(routes_2.usersRoutes, { prefix: "/v1/users" });
exports.app.register(routes_4.transactionsRoutes, { prefix: "/v1/transactions" });
exports.app.register(routes_3.categoriesRoutes, { prefix: "/v1/categories" });
exports.app.register(routes_5.recurringTransactionsRoutes, {
    prefix: "/v1/recurring-transactions",
});
exports.app.register(routes_6.statementImportsRoutes, { prefix: "/v1/statement-imports" });
exports.app.setErrorHandler((error, _request, reply) => {
    if (error instanceof app_error_1.AppError) {
        return reply.status(error.statusCode).send({ error: error.message });
    }
    if (error.statusCode === 401) {
        return reply.status(401).send({ message: "Não autorizado" });
    }
    console.error(error);
    return reply.status(500).send({ error: "Erro interno do servidor." });
});
