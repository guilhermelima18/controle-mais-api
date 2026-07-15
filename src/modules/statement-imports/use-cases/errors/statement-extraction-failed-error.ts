import { AppError } from "../../../../core/errors/app-error";

export class StatementExtractionFailedError extends AppError {
  constructor() {
    super("Não foi possível interpretar o arquivo no momento. Tente novamente.");
  }
}
