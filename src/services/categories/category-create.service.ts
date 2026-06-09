import { prisma } from "@/libs/prisma";

type CategoryCreate = {
  name: string;
  type: "INCOME" | "EXPENSE";
};

export class CategoryCreateService {
  async execute({ name, type }: CategoryCreate) {
    return await prisma.category.create({
      data: {
        name,
        type,
      },
    });
  }
}
