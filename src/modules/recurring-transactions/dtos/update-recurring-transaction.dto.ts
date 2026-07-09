import { z } from "zod";

export const updateRecurringTransactionSchema = z.object({
  description: z.string().optional(),
  amount: z.number().positive("O valor deve ser maior que zero!").optional(),
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  categoryId: z.string().optional(),
});

export type UpdateRecurringTransactionDTO = z.infer<
  typeof updateRecurringTransactionSchema
>;
