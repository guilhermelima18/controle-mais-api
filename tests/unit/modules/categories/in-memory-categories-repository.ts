import { randomUUID } from "node:crypto";
import { Category } from "../../../../src/modules/categories/entities/category";
import {
  CategoryCreateData,
  ICategoriesRepository,
} from "../../../../src/modules/categories/repositories/icategories-repository";

export class InMemoryCategoriesRepository implements ICategoriesRepository {
  public items: Category[] = [];

  async create(data: CategoryCreateData): Promise<Category> {
    const category = new Category({ id: randomUUID(), ...data });
    this.items.push(category);
    return category;
  }

  async findById(id: string): Promise<Category | null> {
    return this.items.find((item) => item.id === id) ?? null;
  }

  async findMany(): Promise<Category[]> {
    return this.items;
  }
}
