import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { CategoryCreateService } from "@/services/categories/category-create.service";

const createCategorySchema = z.object({
  name: z.string("O campo nome é obrigatório!"),
  type: z.string("O campo tipo é obrigatório!"),
});

export class CategoryCreateController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
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

      const categoriesService = new CategoryCreateService();
      await categoriesService.execute({
        name: data.name,
        type: data.type as "INCOME" | "EXPENSE",
      });

      return reply
        .code(201)
        .send({ success: true, message: "Categoria criada com sucesso!" });
    } catch (error: any) {
      return reply.status(500).send({ error: "Erro interno do servidor." });
    }
  }
}
