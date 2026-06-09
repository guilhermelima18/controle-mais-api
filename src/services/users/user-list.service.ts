import { prisma } from "@/libs/prisma";

export class UserListService {
  async execute({ userId }: { userId: string }) {
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      throw new Error("Esse usuário não existe!");
    }

    return userExists;
  }
}
