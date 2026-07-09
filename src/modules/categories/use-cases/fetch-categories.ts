import { ICategoriesRepository } from "../repositories/icategories-repository";

export class FetchCategoriesUseCase {
  constructor(private categoriesRepository: ICategoriesRepository) {}

  async execute() {
    return this.categoriesRepository.findMany();
  }
}
