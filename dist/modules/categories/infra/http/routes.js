"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoriesRoutes = categoriesRoutes;
const create_category_controller_1 = require("./controllers/create-category.controller");
const fetch_category_controller_1 = require("./controllers/fetch-category.controller");
const fetch_categories_controller_1 = require("./controllers/fetch-categories.controller");
async function categoriesRoutes(fastify) {
    fastify.post("/", { onRequest: [fastify.authenticate] }, (request, reply) => {
        const controller = new create_category_controller_1.CreateCategoryController();
        return controller.handle(request, reply);
    });
    fastify.get("/", { onRequest: [fastify.authenticate] }, (request, reply) => {
        const controller = new fetch_categories_controller_1.FetchCategoriesController();
        return controller.handle(request, reply);
    });
    fastify.get("/:id", { onRequest: [fastify.authenticate] }, (request, reply) => {
        const controller = new fetch_category_controller_1.FetchCategoryController();
        return controller.handle(request, reply);
    });
}
