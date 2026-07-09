"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaCategoriesRepository = void 0;
const prisma_1 = require("../../../../infra/database/prisma");
const category_1 = require("../../entities/category");
class PrismaCategoriesRepository {
    async create(data) {
        const category = await prisma_1.prisma.category.create({ data });
        return new category_1.Category(category);
    }
    async findById(id) {
        const category = await prisma_1.prisma.category.findUnique({ where: { id } });
        return category ? new category_1.Category(category) : null;
    }
    async findMany() {
        const categories = await prisma_1.prisma.category.findMany();
        return categories.map((category) => new category_1.Category(category));
    }
}
exports.PrismaCategoriesRepository = PrismaCategoriesRepository;
