import { FastifyReply, FastifyRequest } from "fastify";
import { createTransactionSchema } from "../../../dtos/create-transaction.dto";
import { CreateTransactionUseCase } from "../../../use-cases/create-transaction";
import { PrismaTransactionsRepository } from "../../../repositories/prisma/prisma-transactions-repository";
import { TransactionType } from "../../../entities/transaction";

export class CreateTransactionController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
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

    const transactionsRepository = new PrismaTransactionsRepository();
    const createTransactionUseCase = new CreateTransactionUseCase(
      transactionsRepository,
    );

    await createTransactionUseCase.execute({
      description: data.description,
      amount: data.amount,
      type: data.type as TransactionType,
      date: data.date,
      userId: (request.user as { name: string; sub: string }).sub,
      categoryId: data.categoryId,
    });

    return reply
      .code(201)
      .send({ success: true, message: "Transação criada com sucesso!" });
  }
}
