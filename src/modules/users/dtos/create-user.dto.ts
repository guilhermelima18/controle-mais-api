import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string("O campo nome é obrigatório!"),
  cpf: z.string("O campo CPF é obrigatório!"),
  email: z.email("E-mail inválido"),
  password: z
    .string("O campo senha é obrigatório!")
    .min(6, "A senha deve ter no mínimo 6 caracteres"),
});

export type CreateUserDTO = z.infer<typeof createUserSchema>;
