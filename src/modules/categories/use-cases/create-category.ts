import { ICategoriesRepository } from "../repositories/icategories-repository";
import { TransactionType } from "../entities/category";

type CreateCategoryUseCaseRequest = {
  name: string;
  type: TransactionType;
};

export class CreateCategoryUseCase {
  constructor(private categoriesRepository: ICategoriesRepository) {}

  async execute({ name, type }: CreateCategoryUseCaseRequest) {
    return this.categoriesRepository.create({ name, type });
  }
}
