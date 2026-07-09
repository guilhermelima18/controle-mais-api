import { ITransactionsRepository } from "../repositories/itransactions-repository";
import { TransactionType } from "../entities/transaction";
import { ResourceNotFoundError } from "../../../core/errors/resource-not-found-error";

type UpdateTransactionUseCaseRequest = {
  transactionId: string;
  userId: string;
  description?: string;
  amount?: number;
  type?: TransactionType;
  date?: string;
  categoryId?: string;
};

export class UpdateTransactionUseCase {
  constructor(private transactionsRepository: ITransactionsRepository) {}

  async execute({
    transactionId,
    userId,
    ...data
  }: UpdateTransactionUseCaseRequest) {
    const transaction = await this.transactionsRepository.findByIdAndUser(
      transactionId,
      userId,
    );

    if (!transaction) {
      throw new ResourceNotFoundError("Essa transação não existe!");
    }

    return this.transactionsRepository.update(transactionId, data);
  }
}
