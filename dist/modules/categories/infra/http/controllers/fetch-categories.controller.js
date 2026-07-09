"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FetchCategoriesController = void 0;
const fetch_categories_1 = require("../../../use-cases/fetch-categories");
const prisma_categories_repository_1 = require("../../../repositories/prisma/prisma-categories-repository");
class FetchCategoriesController {
    async handle(request, reply) {
        const categoriesRepository = new prisma_categories_repository_1.PrismaCategoriesRepository();
        const fetchCategoriesUseCase = new fetch_categories_1.FetchCategoriesUseCase(categoriesRepository);
        const categories = await fetchCategoriesUseCase.execute();
        return reply.code(200).send(categories);
    }
}
exports.FetchCategoriesController = FetchCategoriesController;
