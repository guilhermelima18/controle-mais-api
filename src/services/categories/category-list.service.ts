import { prisma } from "../../libs/prisma";

export class CategoryListService {
  async execute({ categoryId }: { categoryId: string }) {
    const categoryExists = await prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (!categoryExists) {
      throw new Error("Essa categoria não existe!");
    }

    return categoryExists;
  }
}
