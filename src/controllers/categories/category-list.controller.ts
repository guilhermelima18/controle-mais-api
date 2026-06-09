import { FastifyReply, FastifyRequest } from "fastify";
import { CategoryListService } from "@/services/categories/category-list.service";

export class CategoryListController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };

      const categoriesService = new CategoryListService();
      const category = await categoriesService.execute({ categoryId: id });

      return reply.code(200).send(category);
    } catch (error: any) {
      if (error.message === "Essa categoria não existe!") {
        return reply.status(404).send({ error: error.message });
      }

      return reply.status(500).send({ error: "Erro interno do servidor." });
    }
  }
}
