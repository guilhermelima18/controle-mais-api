import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";

import { TransactionDeleteService } from "../../services/transactions/transaction-delete.service";

const transactionDeleteSchema = z.object({
  id: z.string("O campo id é obrigatório!"),
});

export class TransactionDeleteController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { success, data, error } = transactionDeleteSchema.safeParse(
        request.params,
      );

      if (!success) {
        return reply.code(400).send({
          errors: error.issues.map((issue) => ({
            campo: issue.path[0],
            message: issue.message,
          })),
        });
      }

      const transactionDeleteService = new TransactionDeleteService();
      await transactionDeleteService.execute({ transactionId: data.id });

      return reply
        .code(201)
        .send({ success: true, message: "Transação excluída com sucesso!" });
    } catch (error: any) {
      console.log(error);

      if (error.message === "Essa transação não existe!") {
        return reply.status(404).send({ error: error.message });
      }

      return reply.status(500).send({ error: "Erro interno do servidor." });
    }
  }
}
