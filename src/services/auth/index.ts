import { compare } from "bcrypt";
import { prisma } from "@/libs/prisma";

type Auth = {
  cpf: string;
  password: string;
};

export class AuthService {
  async execute({ cpf, password }: Auth) {
    const cleanCpf = cpf.replace(/\D/g, "");

    const user = await prisma.user.findUnique({
      where: { cpf: cleanCpf },
    });

    if (!user) {
      throw new Error("Usuário e/ou senha incorretos!");
    }

    const passwordMatch = await compare(password, user.password);

    if (!passwordMatch) {
      throw new Error("Usuário e/ou senha incorretos!");
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }
}
