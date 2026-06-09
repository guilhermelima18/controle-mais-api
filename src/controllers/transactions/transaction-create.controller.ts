import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { TransactionCreateService } from "@/services/transactions/transaction-create.service";

const createTransactionSchema = z.object({
  description: z.string("O campo descrição é obrigatório!"),
  amount: z.number("O campo valor é obrigatório!"),
  type: z.string("O campo tipo é obrigatório!"),
  date: z.string("O campo data é obrigatório"),
  userId: z.string("O campo usuário é obrigatório!"),
  categoryId: z.string("O campo categoria é obrigatório!"),
});

export class TransactionCreateController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { success, data, error } = createTransactionSchema.safeParse(
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

      const transactionsService = new TransactionCreateService();
      await transactionsService.execute({
        description: data.description,
        amount: data.amount,
        type: data.type as "INCOME" | "EXPENSE",
        date: data.date,
        userId: data.userId,
        categoryId: data.categoryId,
      });

      return reply
        .code(201)
        .send({ success: true, message: "Transação criada com sucesso!" });
    } catch (error: any) {
      console.log(error);
      return reply.status(500).send({ error: "Erro interno do servidor." });
    }
  }
}
