"use strict";
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
require("dotenv/config");
exports.env = {
    port: Number(process.env.PORT) || 3333,
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: (_a = process.env.JWT_SECRET) !== null && _a !== void 0 ? _a : "super-secret-key",
    recurringTransactionsCronExpression: (_b = process.env.RECURRING_TRANSACTIONS_CRON_EXPRESSION) !== null && _b !== void 0 ? _b : "*/15 * * * *",
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiModel: (_c = process.env.OPENAI_MODEL) !== null && _c !== void 0 ? _c : "gpt-5-mini",
    statementImportMaxFileSizeBytes: Number((_d = process.env.STATEMENT_IMPORT_MAX_FILE_SIZE_BYTES) !== null && _d !== void 0 ? _d : 10 * 1024 * 1024),
    useFakeAiProvider: process.env.STATEMENT_IMPORT_USE_FAKE_AI_PROVIDER === "true",
};
