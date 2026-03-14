import bcrypt from "bcrypt";
import { prisma } from "../../libs/prisma";

type CreateUser = {
  name: string;
  cpf: string;
  password: string;
};

export class UsersService {
  async create({ name, cpf, password }: CreateUser) {
    const cleanCpf = cpf.replace(/\D/g, "");

    const userExists = await prisma.user.findUnique({
      where: { cpf: cleanCpf },
    });

    if (userExists) {
      throw new Error("Esse usuário já existe!");
    }

    const hashedPassword = await bcrypt.hash(password, 8);

    return await prisma.user.create({
      data: {
        name,
        cpf: cleanCpf,
        password: hashedPassword,
      },
    });
  }
}
