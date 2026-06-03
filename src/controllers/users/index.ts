import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { UsersService } from "../../services/users";

const createUserSchema = z.object({
  name: z.string("O campo nome é obrigatório!"),
  cpf: z.string("O campo CPF é obrigatório!"),
  email: z.email("E-mail inválido"),
  password: z
    .string("O campo senha é obrigatório!")
    .min(6, "A senha deve ter no mínimo 6 caracteres"),
});

export class UsersController {
  async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      const usersService = new UsersService();
      const users = await usersService.list();

      const usersList = users.map((user) => ({
        id: user?.id,
        name: user?.name,
        cpf: user?.cpf,
        email: user?.email,
      }));

      return reply.code(200).send(usersList);
    } catch (error: any) {
      return reply.status(500).send({ error: "Erro interno do servidor." });
    }
  }

  async listById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };

      const usersService = new UsersService();
      const user = await usersService.listById({ id });

      const userList = {
        id: user?.id,
        name: user?.name,
        cpf: user?.cpf,
        email: user?.email,
      };

      return reply.code(200).send(userList);
    } catch (error: any) {
      if (error.message === "Esse usuário não existe!") {
        return reply.status(404).send({ error: error.message });
      }

      return reply.status(500).send({ error: "Erro interno do servidor." });
    }
  }

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
        email: data.email,
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
