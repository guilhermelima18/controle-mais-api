"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateUserUseCase = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const user_already_exists_error_1 = require("./errors/user-already-exists-error");
class CreateUserUseCase {
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }
    async execute({ name, cpf, email, password }) {
        const cleanCpf = cpf.replace(/\D/g, "");
        const userExists = await this.usersRepository.findByCpf(cleanCpf);
        if (userExists) {
            throw new user_already_exists_error_1.UserAlreadyExistsError();
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 8);
        return this.usersRepository.create({
            name,
            cpf: cleanCpf,
            email,
            password: hashedPassword,
        });
    }
}
exports.CreateUserUseCase = CreateUserUseCase;
