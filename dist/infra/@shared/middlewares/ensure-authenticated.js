"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureAuthenticated = ensureAuthenticated;
async function ensureAuthenticated(request, reply) {
    try {
        await request.jwtVerify();
    }
    catch (err) {
        return reply.send(err);
    }
}
