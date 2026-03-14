import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { UsersService } from "../../services/users";

const createUserSchema = z.object({
  name: z.string("O campo nome é obrigatório!"),
  cpf: z.string("O campo CPF é obrigatório!"),
  password: z
    .string("O campo senha é obrigatório!")
    .min(6, "A senha deve ter no mínimo 6 caracteres"),
});

export class UsersController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { success, data, error } = createUserSchema.safeParse(request.body);

      if (!success) {
        return reply.code(400).send({
          errors: error.issues.map((issue) => ({
            campo: issue.path[0],
            message: issue.message,
          })),
        });
      }

      const usersService = new UsersService();
      await usersService.create({
        name: data.name,
        cpf: data.cpf,
        password: data.password,
      });

      return reply
        .code(201)
        .send({ success: true, message: "Usuário criado com sucesso!" });
    } catch (error: any) {
      console.error(error);

      if (error.message === "Esse usuário já existe!") {
        return reply.status(401).send({ error: error.message });
      }

      return reply.status(500).send({ error: "Erro interno do servidor." });
    }
  }
}
