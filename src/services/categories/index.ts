import { prisma } from "../../libs/prisma";

type CategoriesCreate = {
  name: string;
  type: "INCOME" | "EXPENSE";
};

export class CategoriesService {
  async list() {
    return await prisma.category.findMany();
  }

  async listById({ id }: { id: string }) {
    const categoryExists = await prisma.category.findUnique({
      where: {
        id,
      },
    });

    if (!categoryExists) {
      throw new Error("Essa categoria não existe!");
    }

    return categoryExists;
  }

  async create({ name, type }: CategoriesCreate) {
    return await prisma.category.create({
      data: {
        name,
        type,
      },
    });
  }
}
