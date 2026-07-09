import { FastifyReply, FastifyRequest } from "fastify";
import { FetchCategoryByIdUseCase } from "../../../use-cases/fetch-category-by-id";
import { PrismaCategoriesRepository } from "../../../repositories/prisma/prisma-categories-repository";

export class FetchCategoryController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    const categoriesRepository = new PrismaCategoriesRepository();
    const fetchCategoryByIdUseCase = new FetchCategoryByIdUseCase(
      categoriesRepository,
    );

    const category = await fetchCategoryByIdUseCase.execute({
      categoryId: id,
    });

    return reply.code(200).send(category);
  }
}
