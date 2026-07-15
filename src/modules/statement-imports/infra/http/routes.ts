import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ImportStatementController } from "./controllers/import-statement.controller";
import { FetchStatementImportController } from "./controllers/fetch-statement-import.controller";
import { UpdateExtractedTransactionController } from "./controllers/update-extracted-transaction.controller";
import { DiscardExtractedTransactionController } from "./controllers/discard-extracted-transaction.controller";
import { ConfirmStatementImportController } from "./controllers/confirm-statement-import.controller";

export async function statementImportsRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/",
    { onRequest: [fastify.authenticate] },
    (request: FastifyRequest, reply: FastifyReply) => {
      const controller = new ImportStatementController();
      return controller.handle(request, reply);
    },
  );

  fastify.get(
    "/:id",
    { onRequest: [fastify.authenticate] },
    (request: FastifyRequest, reply: FastifyReply) => {
      const controller = new FetchStatementImportController();
      return controller.handle(request, reply);
    },
  );

  fastify.patch(
    "/:id/extracted-transactions/:extractedTransactionId",
    { onRequest: [fastify.authenticate] },
    (request: FastifyRequest, reply: FastifyReply) => {
      const controller = new UpdateExtractedTransactionController();
      return controller.handle(request, reply);
    },
  );

  fastify.delete(
    "/:id/extracted-transactions/:extractedTransactionId",
    { onRequest: [fastify.authenticate] },
    (request: FastifyRequest, reply: FastifyReply) => {
      const controller = new DiscardExtractedTransactionController();
      return controller.handle(request, reply);
    },
  );

  fastify.post(
    "/:id/confirm",
    { onRequest: [fastify.authenticate] },
    (request: FastifyRequest, reply: FastifyReply) => {
      const controller = new ConfirmStatementImportController();
      return controller.handle(request, reply);
    },
  );
}
