import { ITransactionsRepository } from "../repositories/itransactions-repository";

export class FetchTransactionUseCase {
  constructor(private transactionsRepository: ITransactionsRepository) {}

  async execute({
    transactionId,
    userId,
  }: {
    transactionId: string;
    userId: string;
  }) {
    return this.transactionsRepository.findByIdAndUser(transactionId, userId);
  }
}
