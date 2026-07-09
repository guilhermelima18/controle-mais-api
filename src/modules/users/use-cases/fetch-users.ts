import { IUsersRepository } from "../repositories/iusers-repository";

export class FetchUsersUseCase {
  constructor(private usersRepository: IUsersRepository) {}

  async execute() {
    return this.usersRepository.findMany();
  }
}
