"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recurringTransactionsRoutes = recurringTransactionsRoutes;
const create_recurring_transaction_controller_1 = require("./controllers/create-recurring-transaction.controller");
const fetch_recurring_transactions_controller_1 = require("./controllers/fetch-recurring-transactions.controller");
const fetch_recurring_transaction_controller_1 = require("./controllers/fetch-recurring-transaction.controller");
const update_recurring_transaction_controller_1 = require("./controllers/update-recurring-transaction.controller");
const delete_recurring_transaction_controller_1 = require("./controllers/delete-recurring-transaction.controller");
async function recurringTransactionsRoutes(fastify) {
    fastify.post("/", { onRequest: [fastify.authenticate] }, (request, reply) => {
        const controller = new create_recurring_transaction_controller_1.CreateRecurringTransactionController();
        return controller.handle(request, reply);
    });
    fastify.get("/", { onRequest: [fastify.authenticate] }, (request, reply) => {
        const controller = new fetch_recurring_transactions_controller_1.FetchRecurringTransactionsController();
        return controller.handle(request, reply);
    });
    fastify.get("/:id", { onRequest: [fastify.authenticate] }, (request, reply) => {
        const controller = new fetch_recurring_transaction_controller_1.FetchRecurringTransactionController();
        return controller.handle(request, reply);
    });
    fastify.put("/:id", { onRequest: [fastify.authenticate] }, (request, reply) => {
        const controller = new update_recurring_transaction_controller_1.UpdateRecurringTransactionController();
        return controller.handle(request, reply);
    });
    fastify.delete("/:id", { onRequest: [fastify.authenticate] }, (request, reply) => {
        const controller = new delete_recurring_transaction_controller_1.DeleteRecurringTransactionController();
        return controller.handle(request, reply);
    });
}
