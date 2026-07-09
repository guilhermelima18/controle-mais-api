"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
require("dotenv/config");
exports.env = {
    port: Number(process.env.PORT) || 3333,
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: (_a = process.env.JWT_SECRET) !== null && _a !== void 0 ? _a : "super-secret-key",
};
