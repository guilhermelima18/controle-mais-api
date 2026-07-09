import { Category, TransactionType } from "../entities/category";

export type CategoryCreateData = {
  name: string;
  type: TransactionType;
};

export interface ICategoriesRepository {
  create(data: CategoryCreateData): Promise<Category>;
  findById(id: string): Promise<Category | null>;
  findMany(): Promise<Category[]>;
}
