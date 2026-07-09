import { z } from "zod";

export const authenticateSchema = z.object({
  cpf: z.string("O campo CPF é obrigatório!"),
  password: z
    .string("O campo senha é obrigatório!")
    .min(6, "A senha deve ter no mínimo 6 caracteres"),
});

export type AuthenticateDTO = z.infer<typeof authenticateSchema>;
