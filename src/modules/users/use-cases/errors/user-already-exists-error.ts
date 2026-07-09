import { AppError } from "../../../../core/errors/app-error";

export class UserAlreadyExistsError extends AppError {
  constructor() {
    super("Esse usuário já existe!", 401);
  }
}
