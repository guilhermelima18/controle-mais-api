"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FetchUserByIdUseCase = void 0;
const resource_not_found_error_1 = require("../../../core/errors/resource-not-found-error");
class FetchUserByIdUseCase {
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }
    async execute({ userId }) {
        const user = await this.usersRepository.findById(userId);
        if (!user) {
            throw new resource_not_found_error_1.ResourceNotFoundError("Esse usuário não existe!");
        }
        return user;
    }
}
exports.FetchUserByIdUseCase = FetchUserByIdUseCase;
