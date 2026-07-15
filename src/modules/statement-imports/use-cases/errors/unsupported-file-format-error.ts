import { AppError } from "../../../../core/errors/app-error";

export class UnsupportedFileFormatError extends AppError {
  constructor() {
    super(
      "Formato de arquivo não suportado. Envie um arquivo PDF, XLSX, CSV, OFX, BBT ou TXT.",
    );
  }
}
