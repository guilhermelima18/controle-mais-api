import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import fastifyMultipart from "@fastify/multipart";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";

import { env } from "../../config/env";
import { AppError } from "../../core/errors/app-error";
import { ensureAuthenticated } from "../@shared/middlewares/ensure-authenticated";
import { openapiDocument } from "./docs/openapi-document";

import { authRoutes } from "../../modules/auth/infra/http/routes";
import { usersRoutes } from "../../modules/users/infra/http/routes";
import { categoriesRoutes } from "../../modules/categories/infra/http/routes";
import { transactionsRoutes } from "../../modules/transactions/infra/http/routes";
import { recurringTransactionsRoutes } from "../../modules/recurring-transactions/infra/http/routes";
import { statementImportsRoutes } from "../../modules/statement-imports/infra/http/routes";

export const app = Fastify();

app.register(cors);
app.register(fastifyJwt, {
  secret: env.jwtSecret,
});
app.register(fastifyMultipart, {
  limits: { fileSize: env.statementImportMaxFileSizeBytes },
});

app.register(fastifySwagger, {
  mode: "static",
  specification: { document: openapiDocument as any },
});
app.register(fastifySwaggerUi, {
  routePrefix: "/docs",
});

app.decorate("authenticate", ensureAuthenticated);

// Rotas
app.register(authRoutes, { prefix: "/v1/auth" });
app.register(usersRoutes, { prefix: "/v1/users" });
app.register(transactionsRoutes, { prefix: "/v1/transactions" });
app.register(categoriesRoutes, { prefix: "/v1/categories" });
app.register(recurringTransactionsRoutes, {
  prefix: "/v1/recurring-transactions",
});
app.register(statementImportsRoutes, { prefix: "/v1/statement-imports" });

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
