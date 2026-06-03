import { prisma } from "../../libs/prisma";

type CategoriesCreate = {
  name: string;
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

  async create({ name }: CategoriesCreate) {
    return await prisma.category.create({
      data: {
        name,
      },
    });
  }
}
