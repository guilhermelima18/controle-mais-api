import { FastifyReply, FastifyRequest } from "fastify";
import { createRecurringTransactionSchema } from "../../../dtos/create-recurring-transaction.dto";
import { CreateRecurringTransactionUseCase } from "../../../use-cases/create-recurring-transaction";
import { PrismaRecurringTransactionsRepository } from "../../../repositories/prisma/prisma-recurring-transactions-repository";
import { PrismaCategoriesRepository } from "../../../../categories/repositories/prisma/prisma-categories-repository";
import { TransactionType } from "../../../../transactions/entities/transaction";
import { RecurringTransactionFrequency } from "../../../entities/recurring-transaction";

export class CreateRecurringTransactionController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const { success, data, error } = createRecurringTransactionSchema.safeParse(
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
    const createRecurringTransactionUseCase =
      new CreateRecurringTransactionUseCase(
        recurringTransactionsRepository,
        categoriesRepository,
      );

    const { recurringTransaction, createdTransactions } =
      await createRecurringTransactionUseCase.execute({
        description: data.description,
        amount: data.amount,
        type: data.type as TransactionType,
        frequency: data.frequency as RecurringTransactionFrequency,
        startDate: data.startDate,
        endDate: data.endDate,
        userId: (request.user as { name: string; sub: string }).sub,
        categoryId: data.categoryId,
      });

    return reply.code(201).send({
      success: true,
      message: "Recorrência criada com sucesso!",
      recurringTransaction,
      createdTransactions,
    });
  }
}
