import { FastifyReply, FastifyRequest } from "fastify";
import { CategoriesListService } from "@/services/categories/categories-list.service";

export class CategoriesListController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    try {
      const categoriesService = new CategoriesListService();
      const categories = await categoriesService.execute();

      return reply.code(200).send(categories);
    } catch (error: any) {
      return reply.status(500).send({ error: "Erro interno do servidor." });
    }
  }
}
