import { prisma } from "@/libs/prisma";

export class UsersListService {
  async execute() {
    return await prisma.user.findMany();
  }
}
