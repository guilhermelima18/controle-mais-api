import { z } from "zod";

export const createTransactionSchema = z.object({
  description: z.string("O campo descrição é obrigatório!"),
  amount: z.number("O campo valor é obrigatório!"),
  type: z.string("O campo tipo é obrigatório!"),
  date: z.string("O campo data é obrigatório"),
  categoryId: z.string("O campo categoria é obrigatório!"),
});

export type CreateTransactionDTO = z.infer<typeof createTransactionSchema>;
