"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FetchUsersUseCase = void 0;
class FetchUsersUseCase {
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }
    async execute() {
        return this.usersRepository.findMany();
    }
}
exports.FetchUsersUseCase = FetchUsersUseCase;
