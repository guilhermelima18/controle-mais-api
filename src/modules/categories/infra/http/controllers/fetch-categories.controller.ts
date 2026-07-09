import { FastifyReply, FastifyRequest } from "fastify";
import { FetchCategoriesUseCase } from "../../../use-cases/fetch-categories";
import { PrismaCategoriesRepository } from "../../../repositories/prisma/prisma-categories-repository";

export class FetchCategoriesController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const categoriesRepository = new PrismaCategoriesRepository();
    const fetchCategoriesUseCase = new FetchCategoriesUseCase(
      categoriesRepository,
    );

    const categories = await fetchCategoriesUseCase.execute();

    return reply.code(200).send(categories);
  }
}
