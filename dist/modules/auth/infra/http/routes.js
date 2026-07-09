"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = authRoutes;
const authenticate_user_controller_1 = require("./controllers/authenticate-user.controller");
async function authRoutes(fastify) {
    fastify.post("/", (request, reply) => {
        const controller = new authenticate_user_controller_1.AuthenticateUserController();
        return controller.handle(request, reply);
    });
}
