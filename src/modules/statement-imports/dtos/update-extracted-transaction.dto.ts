import { z } from "zod";

export const updateExtractedTransactionSchema = z
  .object({
    date: z.string().optional(),
    description: z.string().optional(),
    amount: z.number().positive("O valor deve ser maior que zero!").optional(),
    type: z.enum(["INCOME", "EXPENSE"]).optional(),
    categoryId: z.string().optional(),
  })
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    { message: "Informe ao menos um campo para atualizar." },
  );

export type UpdateExtractedTransactionDTO = z.infer<
  typeof updateExtractedTransactionSchema
>;
