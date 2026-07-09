import { ICategoriesRepository } from "../repositories/icategories-repository";
import { ResourceNotFoundError } from "../../../core/errors/resource-not-found-error";

export class FetchCategoryByIdUseCase {
  constructor(private categoriesRepository: ICategoriesRepository) {}

  async execute({ categoryId }: { categoryId: string }) {
    const category = await this.categoriesRepository.findById(categoryId);

    if (!category) {
      throw new ResourceNotFoundError("Essa categoria não existe!");
    }

    return category;
  }
}
