import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string("O campo nome é obrigatório!"),
  type: z.string("O campo tipo é obrigatório!"),
});

export type CreateCategoryDTO = z.infer<typeof createCategorySchema>;
