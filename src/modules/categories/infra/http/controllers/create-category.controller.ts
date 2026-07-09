import { FastifyReply, FastifyRequest } from "fastify";
import { createCategorySchema } from "../../../dtos/create-category.dto";
import { CreateCategoryUseCase } from "../../../use-cases/create-category";
import { PrismaCategoriesRepository } from "../../../repositories/prisma/prisma-categories-repository";
import { TransactionType } from "../../../entities/category";

export class CreateCategoryController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const { success, data, error } = createCategorySchema.safeParse(
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

    const categoriesRepository = new PrismaCategoriesRepository();
    const createCategoryUseCase = new CreateCategoryUseCase(
      categoriesRepository,
    );

    await createCategoryUseCase.execute({
      name: data.name,
      type: data.type as TransactionType,
    });

    return reply
      .code(201)
      .send({ success: true, message: "Categoria criada com sucesso!" });
  }
}
