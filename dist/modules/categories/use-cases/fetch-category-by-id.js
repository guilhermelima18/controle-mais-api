"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FetchCategoryByIdUseCase = void 0;
const resource_not_found_error_1 = require("../../../core/errors/resource-not-found-error");
class FetchCategoryByIdUseCase {
    constructor(categoriesRepository) {
        this.categoriesRepository = categoriesRepository;
    }
    async execute({ categoryId }) {
        const category = await this.categoriesRepository.findById(categoryId);
        if (!category) {
            throw new resource_not_found_error_1.ResourceNotFoundError("Essa categoria não existe!");
        }
        return category;
    }
}
exports.FetchCategoryByIdUseCase = FetchCategoryByIdUseCase;
