import { prisma } from "@/libs/prisma";

export class CategoriesListService {
  async execute() {
    return await prisma.category.findMany();
  }
}
