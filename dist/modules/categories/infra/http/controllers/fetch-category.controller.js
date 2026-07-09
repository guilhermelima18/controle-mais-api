"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FetchCategoryController = void 0;
const fetch_category_by_id_1 = require("../../../use-cases/fetch-category-by-id");
const prisma_categories_repository_1 = require("../../../repositories/prisma/prisma-categories-repository");
class FetchCategoryController {
    async handle(request, reply) {
        const { id } = request.params;
        const categoriesRepository = new prisma_categories_repository_1.PrismaCategoriesRepository();
        const fetchCategoryByIdUseCase = new fetch_category_by_id_1.FetchCategoryByIdUseCase(categoriesRepository);
        const category = await fetchCategoryByIdUseCase.execute({
            categoryId: id,
        });
        return reply.code(200).send(category);
    }
}
exports.FetchCategoryController = FetchCategoryController;
