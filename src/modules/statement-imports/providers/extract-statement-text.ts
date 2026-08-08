import * as XLSX from "xlsx";
import pdfParse from "pdf-parse";
import { StatementFileFormat } from "../entities/statement-import";

/**
 * Converte qualquer um dos seis formatos suportados para uma única representação
 * textual, reaproveitada tanto pelo parser de IA quanto pelo parser determinístico de
 * fallback (research.md, Decisão 2). PDFs sem camada de texto (escaneados) retornam string
 * vazia — tratado como "nenhuma transação encontrada" (FR-011), não como erro.
 */
export async function extractStatementText(
  fileBuffer: Buffer,
  format: StatementFileFormat,
): Promise<string> {
  if (format === "PDF") {
    const result = await pdfParse(fileBuffer);
    return stripNullBytes(result.text.trim());
  }

  if (format === "XLSX") {
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    return stripNullBytes(
      workbook.SheetNames.map((sheetName) =>
        XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]),
      ).join("\n"),
    );
  }

  return stripNullBytes(decodeText(fileBuffer));
}

// Postgres rejeita `0x00` em colunas de texto ("invalid byte sequence for encoding
// UTF8: 0x00"). Formatos legados de extrato (BBT/TXT de largura fixa) costumam usar
// padding com bytes nulos, e extrações de PDF/XLSX corrompidos também podem introduzi-los.
function stripNullBytes(text: string): string {
  return text.replace(/\u0000/g, "");
}

function decodeText(fileBuffer: Buffer): string {
  const utf8Text = fileBuffer.toString("utf-8");

  // Se a decodificação UTF-8 introduziu o caractere de substituição (U+FFFD), o arquivo
  // provavelmente está em Latin-1 (comum em exports bancários brasileiros mais antigos).
  if (utf8Text.includes("�")) {
    return fileBuffer.toString("latin1");
  }

  return utf8Text;
}
