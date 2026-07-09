import { z } from "zod";

export const deleteTransactionParamsSchema = z.object({
  id: z.string("O campo id é obrigatório!"),
});

export type DeleteTransactionParamsDTO = z.infer<
  typeof deleteTransactionParamsSchema
>;
