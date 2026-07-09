import { z } from "zod";

export const updateTransactionSchema = z.object({
  description: z.string().optional(),
  amount: z.number().optional(),
  type: z.string().optional(),
  date: z.string().optional(),
  categoryId: z.string().optional(),
});

export type UpdateTransactionDTO = z.infer<typeof updateTransactionSchema>;
