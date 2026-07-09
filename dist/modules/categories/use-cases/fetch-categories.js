"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FetchCategoriesUseCase = void 0;
class FetchCategoriesUseCase {
    constructor(categoriesRepository) {
        this.categoriesRepository = categoriesRepository;
    }
    async execute() {
        return this.categoriesRepository.findMany();
    }
}
exports.FetchCategoriesUseCase = FetchCategoriesUseCase;
