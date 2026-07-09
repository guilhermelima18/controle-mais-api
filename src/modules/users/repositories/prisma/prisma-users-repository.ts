import { prisma } from "../../../../infra/database/prisma";
import { User } from "../../entities/user";
import { IUsersRepository, UserCreateData } from "../iusers-repository";

export class PrismaUsersRepository implements IUsersRepository {
  async create(data: UserCreateData): Promise<User> {
    const user = await prisma.user.create({ data });
    return new User(user);
  }

  async findByCpf(cpf: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { cpf } });
    return user ? new User(user) : null;
  }

  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? new User(user) : null;
  }

  async findMany(): Promise<User[]> {
    const users = await prisma.user.findMany();
    return users.map((user) => new User(user));
  }
}
