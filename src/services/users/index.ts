import bcrypt from "bcrypt";
import { prisma } from "../../libs/prisma";

type UserCreate = {
  name: string;
  cpf: string;
  email: string;
  password: string;
};

export class UsersService {
  async list() {
    return await prisma.user.findMany();
  }

  async listById({ id }: { id: string }) {
    const userExists = await prisma.user.findUnique({
      where: { id },
    });

    if (!userExists) {
      throw new Error("Esse usuário não existe!");
    }

    return userExists;
  }

  async create({ name, cpf, email, password }: UserCreate) {
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
        email,
        password: hashedPassword,
      },
    });
  }
}
