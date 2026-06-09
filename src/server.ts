import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";

import { authRoutes } from "./routes/auth";

import { usersListRoute } from "./routes/users/users-list.route";
import { userListRoute } from "./routes/users/user-list.route";
import { userCreateRoute } from "./routes/users/user-create.route";

import { transactionsListFiltersRoute } from "./routes/transactions/transactions-list-filters.route";
import { transactionCreateRoute } from "./routes/transactions/transaction-create.route";
import { transactionDeleteRoute } from "./routes/transactions/transaction-delete.route";

import { categoriesListRoute } from "./routes/categories/categories-list.route";
import { categoryListRoute } from "./routes/categories/category-list.route";
import { categoryCreateRoute } from "./routes/categories/category-create.route";

const app = Fastify();

// Plugins
app.register(cors);
app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET ?? "super-secret-key",
});

// Rotas
// Autenticação
app.register(authRoutes, { prefix: "/v1/auth" });

// Usuários
app.register(usersListRoute, { prefix: "/v1/users" });
app.register(userListRoute, { prefix: "/v1/users" });
app.register(userCreateRoute, { prefix: "/v1/users" });

// Transações
app.register(transactionsListFiltersRoute, { prefix: "/v1/transactions" });
app.register(transactionCreateRoute, { prefix: "/v1/transactions" });
app.register(transactionDeleteRoute, { prefix: "/v1/transactions" });

// Categorias
app.register(categoriesListRoute, { prefix: "/v1/categories" });
app.register(categoryListRoute, { prefix: "/v1/categories" });
app.register(categoryCreateRoute, { prefix: "/v1/categories" });

app.decorate(
  "authenticate",
  async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  },
);

app.setErrorHandler((error: any, _, reply) => {
  if (error.statusCode === 401) {
    return reply.status(401).send({ message: "Não autorizado" });
  }

  return reply.status(error.statusCode ?? 500).send({ message: error.message });
});

const start = async () => {
  try {
    await app.listen({
      port: 3333,
      host: "0.0.0.0",
    });

    console.log("Servidor rodando na porta:", 3333);
  } catch (error) {
    console.error("Erro ao iniciar servidor:", error);
    process.exit(1);
  }
};

start();
