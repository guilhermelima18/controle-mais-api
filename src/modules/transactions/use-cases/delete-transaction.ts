import { ITransactionsRepository } from "../repositories/itransactions-repository";
import { ResourceNotFoundError } from "../../../core/errors/resource-not-found-error";

export class DeleteTransactionUseCase {
  constructor(private transactionsRepository: ITransactionsRepository) {}

  async execute({
    transactionId,
    userId,
  }: {
    transactionId: string;
    userId: string;
  }) {
    const transaction = await this.transactionsRepository.findByIdAndUser(
      transactionId,
      userId,
    );

    if (!transaction) {
      throw new ResourceNotFoundError("Essa transação não existe!");
    }

    await this.transactionsRepository.delete(transactionId);
  }
}
