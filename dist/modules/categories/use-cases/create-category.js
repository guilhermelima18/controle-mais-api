"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateCategoryUseCase = void 0;
class CreateCategoryUseCase {
    constructor(categoriesRepository) {
        this.categoriesRepository = categoriesRepository;
    }
    async execute({ name, type }) {
        return this.categoriesRepository.create({ name, type });
    }
}
exports.CreateCategoryUseCase = CreateCategoryUseCase;
