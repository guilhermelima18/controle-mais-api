import { AppError } from "../../../../core/errors/app-error";

export class InvalidCredentialsError extends AppError {
  constructor() {
    super("Usuário e/ou senha incorretos!", 401);
  }
}
