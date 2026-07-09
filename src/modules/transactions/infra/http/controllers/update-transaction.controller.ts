import { FastifyReply, FastifyRequest } from "fastify";
import { updateTransactionSchema } from "../../../dtos/update-transaction.dto";
import { UpdateTransactionUseCase } from "../../../use-cases/update-transaction";
import { PrismaTransactionsRepository } from "../../../repositories/prisma/prisma-transactions-repository";
import { TransactionType } from "../../../entities/transaction";

export class UpdateTransactionController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
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

    const transactionsRepository = new PrismaTransactionsRepository();
    const updateTransactionUseCase = new UpdateTransactionUseCase(
      transactionsRepository,
    );

    await updateTransactionUseCase.execute({
      transactionId,
      userId: (request.user as { name: string; sub: string }).sub,
      description: data.description,
      amount: data.amount,
      type: data.type as TransactionType,
      date: data.date,
      categoryId: data.categoryId,
    });

    return reply
      .code(201)
      .send({ success: true, message: "Transação atualizada com sucesso!" });
  }
}
