import { FastifyReply, FastifyRequest } from "fastify";
import { DeleteRecurringTransactionUseCase } from "../../../use-cases/delete-recurring-transaction";
import { PrismaRecurringTransactionsRepository } from "../../../repositories/prisma/prisma-recurring-transactions-repository";

export class DeleteRecurringTransactionController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const { id: recurringTransactionId } = request.params as { id: string };

    const recurringTransactionsRepository =
      new PrismaRecurringTransactionsRepository();
    const deleteRecurringTransactionUseCase =
      new DeleteRecurringTransactionUseCase(recurringTransactionsRepository);

    await deleteRecurringTransactionUseCase.execute({
      recurringTransactionId,
      userId: (request.user as { name: string; sub: string }).sub,
    });

    return reply
      .code(200)
      .send({ success: true, message: "Recorrência removida com sucesso!" });
  }
}
