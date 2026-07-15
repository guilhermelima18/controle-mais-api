import * as XLSX from "xlsx";
import { StatementFileFormat } from "../../entities/statement-import";
import {
  IStatementFileParser,
  ParsedTransaction,
  StatementFileParserResult,
} from "../istatement-file-parser";
import { extractStatementText } from "../extract-statement-text";

const DATE_PATTERN = /\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/;
const AMOUNT_PATTERN = /-?R?\$?\s*-?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})/;

/**
 * Parser sem IA usado como fallback quando o GPT-5-Mini falha ou estoura o limite de
 * tokens (FR-015). Cada formato usa a estratégia determinística mais confiável disponível
 * para sua estrutura (research.md, Decisão 9). Nunca sugere categoria — o campo
 * `suggestedCategoryName` é sempre omitido.
 */
export class DeterministicStatementFileParser implements IStatementFileParser {
  async parse(
    fileBuffer: Buffer,
    format: StatementFileFormat,
    _existingCategoryNames: string[],
  ): Promise<StatementFileParserResult> {
    if (format === "OFX") {
      return { transactions: parseOfx(fileBuffer.toString("utf-8")), method: "FALLBACK" };
    }

    if (format === "CSV") {
      return {
        transactions: parseDelimitedText(fileBuffer.toString("utf-8")),
        method: "FALLBACK",
      };
    }

    if (format === "XLSX") {
      return { transactions: parseXlsx(fileBuffer), method: "FALLBACK" };
    }

    const text = await extractStatementText(fileBuffer, format);
    return { transactions: parseGenericText(text), method: "FALLBACK" };
  }
}

function inferType(amount: number): ParsedTransaction["type"] {
  return amount < 0 ? "EXPENSE" : "INCOME";
}

function toIsoDate(rawDate: string): string {
  if (/^\d{4}-\d{2}-\d{2}/.test(rawDate)) {
    return rawDate.slice(0, 10);
  }

  const [day, month, year] = rawDate.split("/");
  return `${year}-${month}-${day}`;
}

function parseAmount(rawAmount: string): number {
  const normalized = rawAmount
    .replace(/R\$\s?/, "")
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}(?:[.,]|$))/g, "")
    .replace(",", ".");
  return Number(normalized);
}

function parseOfx(text: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  const blocks = text.split(/<STMTTRN>/i).slice(1);

  for (const block of blocks) {
    const dateMatch = block.match(/<DTPOSTED>([^\n<]+)/i);
    const amountMatch = block.match(/<TRNAMT>([^\n<]+)/i);
    const descriptionMatch = block.match(/<(?:MEMO|NAME)>([^\n<]+)/i);

    if (!dateMatch || !amountMatch) continue;

    const rawDate = dateMatch[1].trim();
    const amount = Number(amountMatch[1].trim());
    if (Number.isNaN(amount)) continue;

    transactions.push({
      date: `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`,
      description: descriptionMatch ? descriptionMatch[1].trim() : "",
      amount: Math.abs(amount),
      type: inferType(amount),
    });
  }

  return transactions;
}

function parseRowsByColumnHeuristic(rows: string[][]): ParsedTransaction[] {
  if (rows.length === 0) return [];

  const header = rows[0].map((cell) => cell.toLowerCase());
  const dateIndex = header.findIndex((cell) => /data|date/.test(cell));
  const descriptionIndex = header.findIndex((cell) =>
    /desc|histórico|historico/.test(cell),
  );
  const amountIndex = header.findIndex((cell) =>
    /valor|amount|value/.test(cell),
  );

  if (dateIndex === -1 || amountIndex === -1) return [];

  const dataRows = rows.slice(1);
  const transactions: ParsedTransaction[] = [];

  for (const row of dataRows) {
    const rawDate = row[dateIndex]?.trim();
    const rawAmount = row[amountIndex]?.trim();
    if (!rawDate || !rawAmount) continue;

    const amount = parseAmount(rawAmount);
    if (Number.isNaN(amount)) continue;

    transactions.push({
      date: DATE_PATTERN.test(rawDate) ? toIsoDate(rawDate) : rawDate,
      description: descriptionIndex !== -1 ? row[descriptionIndex]?.trim() ?? "" : "",
      amount: Math.abs(amount),
      type: inferType(amount),
    });
  }

  return transactions;
}

function parseDelimitedText(text: string): ParsedTransaction[] {
  const delimiter = text.includes(";") ? ";" : ",";
  const rows = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.split(delimiter));

  return parseRowsByColumnHeuristic(rows);
}

function parseXlsx(fileBuffer: Buffer): ParsedTransaction[] {
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  return parseRowsByColumnHeuristic(
    rows.map((row) => row.map((cell) => String(cell ?? ""))),
  );
}

function parseGenericText(text: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  for (const line of lines) {
    const dateMatch = line.match(DATE_PATTERN);
    const amountMatch = line.match(AMOUNT_PATTERN);
    if (!dateMatch || !amountMatch) continue;

    const amount = parseAmount(amountMatch[0]);
    if (Number.isNaN(amount)) continue;

    const description = line
      .replace(dateMatch[0], "")
      .replace(amountMatch[0], "")
      .trim();

    transactions.push({
      date: toIsoDate(dateMatch[0]),
      description,
      amount: Math.abs(amount),
      type: inferType(amount),
    });
  }

  return transactions;
}
