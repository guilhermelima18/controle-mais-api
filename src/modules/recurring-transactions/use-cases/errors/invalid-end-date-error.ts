import { AppError } from "../../../../core/errors/app-error";

export class InvalidEndDateError extends AppError {
  constructor() {
    super("A data de término deve ser posterior à data de início!", 400);
  }
}
