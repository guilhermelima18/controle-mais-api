"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateCategoryController = void 0;
const create_category_dto_1 = require("../../../dtos/create-category.dto");
const create_category_1 = require("../../../use-cases/create-category");
const prisma_categories_repository_1 = require("../../../repositories/prisma/prisma-categories-repository");
class CreateCategoryController {
    async handle(request, reply) {
        const { success, data, error } = create_category_dto_1.createCategorySchema.safeParse(request.body);
        if (!success) {
            return reply.code(400).send({
                errors: error.issues.map((issue) => ({
                    campo: issue.path[0],
                    message: issue.message,
                })),
            });
        }
        const categoriesRepository = new prisma_categories_repository_1.PrismaCategoriesRepository();
        const createCategoryUseCase = new create_category_1.CreateCategoryUseCase(categoriesRepository);
        await createCategoryUseCase.execute({
            name: data.name,
            type: data.type,
        });
        return reply
            .code(201)
            .send({ success: true, message: "Categoria criada com sucesso!" });
    }
}
exports.CreateCategoryController = CreateCategoryController;
