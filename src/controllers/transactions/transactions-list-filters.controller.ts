import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { TransactionsListFiltersService } from "../../services/transactions/transactions-list-filters.service";

const listTransactionsByFiltersSchema = z.object({
  search: z.string().optional(),
  type: z.string().optional(),
  category: z.string().optional(),
  initialDate: z.string().optional(),
  finalDate: z.string().optional(),
  page: z.string().optional(),
  perPage: z.string().optional(),
});

export class TransactionsListFiltersController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { success, data, error } =
        listTransactionsByFiltersSchema.safeParse(request.query);

      if (!success) {
        return reply.code(400).send({
          errors: error.issues.map((issue) => ({
            campo: issue.path[0],
            message: issue.message,
          })),
        });
      }

      const transactionsService = new TransactionsListFiltersService();
      const transactions = await transactionsService.execute({
        search: data.search,
        categoryId: data.category,
        type: data.type,
        initialDate: data.initialDate,
        finalDate: data.finalDate,
        user: request.user as { name: string; sub: string },
        page: Number(data.page),
        perPage: Number(data.perPage),
      });

      return reply.code(200).send(transactions);
    } catch (error) {
      console.log(error);
      return reply.status(500).send({ error: "Erro interno do servidor." });
    }
  }
}
