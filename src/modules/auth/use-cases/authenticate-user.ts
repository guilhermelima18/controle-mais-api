import { compare } from "bcrypt";
import { IUsersRepository } from "../../users/repositories/iusers-repository";
import { InvalidCredentialsError } from "./errors/invalid-credentials-error";

type AuthenticateUserUseCaseRequest = {
  cpf: string;
  password: string;
};

export class AuthenticateUserUseCase {
  constructor(private usersRepository: IUsersRepository) {}

  async execute({ cpf, password }: AuthenticateUserUseCaseRequest) {
    const cleanCpf = cpf.replace(/\D/g, "");

    const user = await this.usersRepository.findByCpf(cleanCpf);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const passwordMatch = await compare(password, user.password);

    if (!passwordMatch) {
      throw new InvalidCredentialsError();
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }
}
