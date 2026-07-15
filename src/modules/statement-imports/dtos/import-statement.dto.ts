import { z } from "zod";
import { StatementFileFormat } from "../entities/statement-import";

const EXTENSION_TO_FORMAT: Record<string, StatementFileFormat> = {
  pdf: "PDF",
  xlsx: "XLSX",
  csv: "CSV",
  ofx: "OFX",
  bbt: "BBT",
  txt: "TXT",
};

export const importStatementSchema = z.object({
  fileName: z.string("O arquivo é obrigatório!"),
});

export type ImportStatementDTO = z.infer<typeof importStatementSchema>;

export function resolveFileFormat(fileName: string): StatementFileFormat | null {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (!extension) return null;
  return EXTENSION_TO_FORMAT[extension] ?? null;
}
