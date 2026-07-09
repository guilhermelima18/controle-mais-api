import { app } from "./app";
import { env } from "../../config/env";

const start = async () => {
  try {
    await app.listen({
      port: env.port,
      host: "0.0.0.0",
    });

    console.log("Servidor rodando na porta:", env.port);
  } catch (error) {
    console.error("Erro ao iniciar servidor:", error);
    process.exit(1);
  }
};

start();
