"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRoutes = usersRoutes;
const create_user_controller_1 = require("./controllers/create-user.controller");
const fetch_user_controller_1 = require("./controllers/fetch-user.controller");
const fetch_users_controller_1 = require("./controllers/fetch-users.controller");
async function usersRoutes(fastify) {
    fastify.post("/", (request, reply) => {
        const controller = new create_user_controller_1.CreateUserController();
        return controller.handle(request, reply);
    });
    fastify.get("/", { onRequest: [fastify.authenticate] }, (request, reply) => {
        const controller = new fetch_users_controller_1.FetchUsersController();
        return controller.handle(request, reply);
    });
    fastify.get("/:id", { onRequest: [fastify.authenticate] }, (request, reply) => {
        const controller = new fetch_user_controller_1.FetchUserController();
        return controller.handle(request, reply);
    });
}
