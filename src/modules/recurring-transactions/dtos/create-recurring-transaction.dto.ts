import { z } from "zod";

export const createRecurringTransactionSchema = z.object({
  description: z.string("O campo descrição é obrigatório!"),
  amount: z.number("O campo valor é obrigatório!").positive("O valor deve ser maior que zero!"),
  type: z.enum(["INCOME", "EXPENSE"], "O campo tipo é obrigatório!"),
  frequency: z.enum(
    ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"],
    "O campo frequência é obrigatório!",
  ),
  startDate: z.string("O campo data de início é obrigatório!"),
  endDate: z.string().optional(),
  categoryId: z.string("O campo categoria é obrigatório!"),
});

export type CreateRecurringTransactionDTO = z.infer<
  typeof createRecurringTransactionSchema
>;
