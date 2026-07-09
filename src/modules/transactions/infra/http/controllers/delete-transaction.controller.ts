import { FastifyReply, FastifyRequest } from "fastify";
import { deleteTransactionParamsSchema } from "../../../dtos/delete-transaction.dto";
import { DeleteTransactionUseCase } from "../../../use-cases/delete-transaction";
import { PrismaTransactionsRepository } from "../../../repositories/prisma/prisma-transactions-repository";

export class DeleteTransactionController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const { success, data, error } = deleteTransactionParamsSchema.safeParse(
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

    const transactionsRepository = new PrismaTransactionsRepository();
    const deleteTransactionUseCase = new DeleteTransactionUseCase(
      transactionsRepository,
    );

    await deleteTransactionUseCase.execute({
      transactionId: data.id,
      userId: (request.user as { name: string; sub: string }).sub,
    });

    return reply
      .code(201)
      .send({ success: true, message: "Transação excluída com sucesso!" });
  }
}
