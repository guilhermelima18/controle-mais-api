"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionsRoutes = transactionsRoutes;
const create_transaction_controller_1 = require("./controllers/create-transaction.controller");
const update_transaction_controller_1 = require("./controllers/update-transaction.controller");
const delete_transaction_controller_1 = require("./controllers/delete-transaction.controller");
const fetch_transaction_controller_1 = require("./controllers/fetch-transaction.controller");
const fetch_transactions_by_filters_controller_1 = require("./controllers/fetch-transactions-by-filters.controller");
const get_transactions_dashboard_controller_1 = require("./controllers/get-transactions-dashboard.controller");
async function transactionsRoutes(fastify) {
    fastify.post("/", { onRequest: [fastify.authenticate] }, (request, reply) => {
        const controller = new create_transaction_controller_1.CreateTransactionController();
        return controller.handle(request, reply);
    });
    fastify.get("/", { onRequest: [fastify.authenticate] }, (request, reply) => {
        const controller = new fetch_transactions_by_filters_controller_1.FetchTransactionsByFiltersController();
        return controller.handle(request, reply);
    });
    fastify.get("/dashboard", { onRequest: [fastify.authenticate] }, (request, reply) => {
        const controller = new get_transactions_dashboard_controller_1.GetTransactionsDashboardController();
        return controller.handle(request, reply);
    });
    fastify.get("/:id", { onRequest: [fastify.authenticate] }, (request, reply) => {
        const controller = new fetch_transaction_controller_1.FetchTransactionController();
        return controller.handle(request, reply);
    });
    fastify.put("/:id", { onRequest: [fastify.authenticate] }, (request, reply) => {
        const controller = new update_transaction_controller_1.UpdateTransactionController();
        return controller.handle(request, reply);
    });
    fastify.delete("/:id", { onRequest: [fastify.authenticate] }, (request, reply) => {
        const controller = new delete_transaction_controller_1.DeleteTransactionController();
        return controller.handle(request, reply);
    });
}
