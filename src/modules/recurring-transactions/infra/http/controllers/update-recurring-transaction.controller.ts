import { FastifyReply, FastifyRequest } from "fastify";
import { updateRecurringTransactionSchema } from "../../../dtos/update-recurring-transaction.dto";
import { UpdateRecurringTransactionUseCase } from "../../../use-cases/update-recurring-transaction";
import { PrismaRecurringTransactionsRepository } from "../../../repositories/prisma/prisma-recurring-transactions-repository";
import { PrismaCategoriesRepository } from "../../../../categories/repositories/prisma/prisma-categories-repository";
import { TransactionType } from "../../../../transactions/entities/transaction";
import { RecurringTransactionFrequency } from "../../../entities/recurring-transaction";

export class UpdateRecurringTransactionController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const { id: recurringTransactionId } = request.params as { id: string };
    const { success, data, error } = updateRecurringTransactionSchema.safeParse(
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

    const recurringTransactionsRepository =
      new PrismaRecurringTransactionsRepository();
    const categoriesRepository = new PrismaCategoriesRepository();
    const updateRecurringTransactionUseCase =
      new UpdateRecurringTransactionUseCase(
        recurringTransactionsRepository,
        categoriesRepository,
      );

    await updateRecurringTransactionUseCase.execute({
      recurringTransactionId,
      userId: (request.user as { name: string; sub: string }).sub,
      data: {
        description: data.description,
        amount: data.amount,
        type: data.type as TransactionType | undefined,
        frequency: data.frequency as RecurringTransactionFrequency | undefined,
        startDate: data.startDate,
        endDate: data.endDate,
        categoryId: data.categoryId,
      },
    });

    return reply
      .code(200)
      .send({ success: true, message: "Recorrência atualizada com sucesso!" });
  }
}
