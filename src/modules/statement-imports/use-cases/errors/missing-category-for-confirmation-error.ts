import { AppError } from "../../../../core/errors/app-error";

export class MissingCategoryForConfirmationError extends AppError {
  constructor(extractedTransactionIds: string[]) {
    super(
      `As seguintes transações extraídas precisam de uma categoria antes da confirmação: ${extractedTransactionIds.join(", ")}.`,
    );
  }
}
