import { AppError } from "../../../../core/errors/app-error";

export class FileTooLargeError extends AppError {
  constructor(maxSizeBytes: number) {
    super(
      `Arquivo excede o tamanho máximo permitido de ${Math.floor(maxSizeBytes / (1024 * 1024))}MB.`,
    );
  }
}
