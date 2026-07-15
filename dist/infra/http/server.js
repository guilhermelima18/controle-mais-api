"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("../../config/env");
const scheduler_1 = require("../jobs/scheduler");
const start = async () => {
    try {
        await app_1.app.listen({
            port: env_1.env.port,
            host: "0.0.0.0",
        });
        console.log("Servidor rodando na porta:", env_1.env.port);
        (0, scheduler_1.startScheduledJobs)();
    }
    catch (error) {
        console.error("Erro ao iniciar servidor:", error);
        process.exit(1);
    }
};
start();
