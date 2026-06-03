import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";

import { CategoriesService } from "../../services/categories";

const createCategorySchema = z.object({
  name: z.string("O campo nome é obrigatório!"),
});

export class CategoriesController {
  async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      const categoriesService = new CategoriesService();
      const categories = await categoriesService.list();

      return reply.code(200).send(categories);
    } catch (error: any) {
      return reply.status(500).send({ error: "Erro interno do servidor." });
    }
  }

  async listById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };

      const categoriesService = new CategoriesService();
      const category = await categoriesService.listById({ id });

      return reply.code(200).send(category);
    } catch (error: any) {
      if (error.message === "Essa categoria não existe!") {
        return reply.status(404).send({ error: error.message });
      }

      return reply.status(500).send({ error: "Erro interno do servidor." });
    }
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
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

      const categoriesService = new CategoriesService();
      await categoriesService.create({
        name: data.name,
      });

      return reply
        .code(201)
        .send({ success: true, message: "Categoria criada com sucesso!" });
    } catch (error: any) {
      return reply.status(500).send({ error: "Erro interno do servidor." });
    }
  }
}
