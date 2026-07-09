import { ITransactionsRepository } from "../repositories/itransactions-repository";
import { TransactionType } from "../entities/transaction";

type CreateTransactionUseCaseRequest = {
  description: string;
  amount: number;
  type: TransactionType;
  date: string;
  userId: string;
  categoryId: string;
};

export class CreateTransactionUseCase {
  constructor(private transactionsRepository: ITransactionsRepository) {}

  async execute(data: CreateTransactionUseCaseRequest) {
    return this.transactionsRepository.create(data);
  }
}
