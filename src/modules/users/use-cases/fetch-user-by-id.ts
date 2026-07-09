import { IUsersRepository } from "../repositories/iusers-repository";
import { ResourceNotFoundError } from "../../../core/errors/resource-not-found-error";

export class FetchUserByIdUseCase {
  constructor(private usersRepository: IUsersRepository) {}

  async execute({ userId }: { userId: string }) {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new ResourceNotFoundError("Esse usuário não existe!");
    }

    return user;
  }
}
