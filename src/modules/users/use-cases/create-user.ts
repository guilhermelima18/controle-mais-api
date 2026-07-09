import bcrypt from "bcrypt";
import { IUsersRepository } from "../repositories/iusers-repository";
import { UserAlreadyExistsError } from "./errors/user-already-exists-error";

type CreateUserUseCaseRequest = {
  name: string;
  cpf: string;
  email: string;
  password: string;
};

export class CreateUserUseCase {
  constructor(private usersRepository: IUsersRepository) {}

  async execute({ name, cpf, email, password }: CreateUserUseCaseRequest) {
    const cleanCpf = cpf.replace(/\D/g, "");

    const userExists = await this.usersRepository.findByCpf(cleanCpf);

    if (userExists) {
      throw new UserAlreadyExistsError();
    }

    const hashedPassword = await bcrypt.hash(password, 8);

    return this.usersRepository.create({
      name,
      cpf: cleanCpf,
      email,
      password: hashedPassword,
    });
  }
}
