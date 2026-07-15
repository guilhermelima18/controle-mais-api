import { AppError } from "../../../../core/errors/app-error";

export class StatementImportAlreadyConfirmedError extends AppError {
  constructor() {
    super("Esta importação já foi confirmada e não pode mais ser alterada.");
  }
}
