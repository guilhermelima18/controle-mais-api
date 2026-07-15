import { AppError } from "../../../../core/errors/app-error";

export class CategoryNotFoundError extends AppError {
  constructor() {
    super("Categoria não encontrada.");
  }
}
