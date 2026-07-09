import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";

import { env } from "../../config/env";
import { AppError } from "../../core/errors/app-error";
import { ensureAuthenticated } from "../@shared/middlewares/ensure-authenticated";

import { authRoutes } from "../../modules/auth/infra/http/routes";
import { usersRoutes } from "../../modules/users/infra/http/routes";
import { categoriesRoutes } from "../../modules/categories/infra/http/routes";
import { transactionsRoutes } from "../../modules/transactions/infra/http/routes";

export const app = Fastify();

// Plugins
app.register(cors);
app.register(fastifyJwt, {
  secret: env.jwtSecret,
});

app.decorate("authenticate", ensureAuthenticated);

// Rotas
app.register(authRoutes, { prefix: "/v1/auth" });
app.register(usersRoutes, { prefix: "/v1/users" });
app.register(transactionsRoutes, { prefix: "/v1/transactions" });
app.register(categoriesRoutes, { prefix: "/v1/categories" });

app.setErrorHandler(
  (error: any, _request: FastifyRequest, reply: FastifyReply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ error: error.message });
    }

    if (error.statusCode === 401) {
      return reply.status(401).send({ message: "Não autorizado" });
    }

    console.error(error);

    return reply.status(500).send({ error: "Erro interno do servidor." });
  },
);
