import { prisma } from "../../../../infra/database/prisma";
import { Category } from "../../entities/category";
import {
  CategoryCreateData,
  ICategoriesRepository,
} from "../icategories-repository";

export class PrismaCategoriesRepository implements ICategoriesRepository {
  async create(data: CategoryCreateData): Promise<Category> {
    const category = await prisma.category.create({ data });
    return new Category(category);
  }

  async findById(id: string): Promise<Category | null> {
    const category = await prisma.category.findUnique({ where: { id } });
    return category ? new Category(category) : null;
  }

  async findMany(): Promise<Category[]> {
    const categories = await prisma.category.findMany();
    return categories.map((category) => new Category(category));
  }
}
