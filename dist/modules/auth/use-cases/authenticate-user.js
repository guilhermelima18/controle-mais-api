"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticateUserUseCase = void 0;
const bcrypt_1 = require("bcrypt");
const invalid_credentials_error_1 = require("./errors/invalid-credentials-error");
class AuthenticateUserUseCase {
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }
    async execute({ cpf, password }) {
        const cleanCpf = cpf.replace(/\D/g, "");
        const user = await this.usersRepository.findByCpf(cleanCpf);
        if (!user) {
            throw new invalid_credentials_error_1.InvalidCredentialsError();
        }
        const passwordMatch = await (0, bcrypt_1.compare)(password, user.password);
        if (!passwordMatch) {
            throw new invalid_credentials_error_1.InvalidCredentialsError();
        }
        return {
            id: user.id,
            name: user.name,
            email: user.email,
        };
    }
}
exports.AuthenticateUserUseCase = AuthenticateUserUseCase;
