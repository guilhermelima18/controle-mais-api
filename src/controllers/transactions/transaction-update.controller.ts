import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { TransactionUpdateService } from "../../services/transactions/transaction-update.service";

const updateTransactionSchema = z.object({
  description: z.string().optional(),
  amount: z.number().optional(),
  type: z.string().optional(),
  date: z.string().optional(),
  categoryId: z.string().optional(),
  userId: z.string("O campo usuário é obrigatório!"),
});

export class TransactionUpdateController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id: transactionId } = request.params as { id: string };
      const { success, data, error } = updateTransactionSchema.safeParse(
        request.body,
      );

      if (!success) {
        return reply.code(400).send({
          errors: error.issues.map((issue) => ({
            campo: issue.path[0],
            message: issue.message,
          })),
        });
      }

      const transactionsService = new TransactionUpdateService();
      await transactionsService.execute({
        description: data.description,
        amount: data.amount,
        type: data.type as "INCOME" | "EXPENSE",
        date: data.date,
        categoryId: data.categoryId,
        userId: data.userId,
        transactionId,
      });

      return reply
        .code(201)
        .send({ success: true, message: "Transação atualizada com sucesso!" });
    } catch (error: any) {
      console.log(error);
      return reply.status(500).send({ error: "Erro interno do servidor." });
    }
  }
}
