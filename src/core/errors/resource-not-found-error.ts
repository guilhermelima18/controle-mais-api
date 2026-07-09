import { AppError } from "./app-error";

export class ResourceNotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}
