import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { AuthService } from "../../services/auth";

const authSchema = z.object({
  cpf: z.string("O campo CPF é obrigatório!"),
  password: z
    .string("O campo senha é obrigatório!")
    .min(6, "A senha deve ter no mínimo 6 caracteres"),
});

export class AuthController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { success, data, error } = authSchema.safeParse(request.body);

      if (!success) {
        return reply.code(400).send({
          errors: error.issues.map((issue) => ({
            campo: issue.path[0],
            message: issue.message,
          })),
        });
      }

      const authService = new AuthService();
      const userAuth = await authService.execute({
        cpf: data.cpf,
        password: data.password,
      });

      const token = await reply.jwtSign(
        { name: userAuth.name },
        {
          sign: {
            sub: userAuth.id,
            expiresIn: "7d",
          },
        },
      );

      return reply.code(200).send({
        user: userAuth,
        token,
      });
    } catch (error: any) {
      console.error(error);

      if (error.message === "Usuário e/ou senha incorretos!") {
        return reply.status(401).send({ error: error.message });
      }

      return reply.status(500).send({ error: "Erro interno do servidor." });
    }
  }
}
