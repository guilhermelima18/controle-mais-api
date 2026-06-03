import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";

import { authRoutes } from "./routes/auth";
import { usersRoutes } from "./routes/users";
import { transactionsRoutes } from "./routes/transactions";
import { categoriesRoutes } from "./routes/categories";

const app = Fastify();

// Plugins
app.register(cors);
app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET ?? "super-secret-key",
});

// Rotas
app.register(authRoutes, { prefix: "/v1/auth" });
app.register(usersRoutes, { prefix: "/v1/users" });
app.register(transactionsRoutes, { prefix: "/v1/transactions" });
app.register(categoriesRoutes, { prefix: "/v1/categories" });

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
