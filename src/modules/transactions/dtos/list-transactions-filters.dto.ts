import { z } from "zod";

export const listTransactionsByFiltersSchema = z.object({
  search: z.string().optional(),
  type: z.string().optional(),
  category: z.string().optional(),
  initialDate: z.string().optional(),
  finalDate: z.string().optional(),
  page: z.string().optional(),
  perPage: z.string().optional(),
});

export type ListTransactionsByFiltersDTO = z.infer<
  typeof listTransactionsByFiltersSchema
>;
