import { StatementFileFormat } from "../entities/statement-import";
import {
  IStatementFileParser,
  StatementFileParserResult,
} from "./istatement-file-parser";

/**
 * Compõe o parser primário (IA) com o parser de fallback (determinístico): tenta o
 * primário, e só recorre ao fallback se o primário lançar erro (falha de serviço, rede, ou
 * estouro de limite de tokens). Propaga o erro apenas se o fallback também lançar, para
 * que o use case marque a importação como `FAILED` (FR-012, FR-015, research.md, Decisão
 * 10).
 */
export class StatementFileParserWithFallback implements IStatementFileParser {
  constructor(
    private primary: IStatementFileParser,
    private fallback: IStatementFileParser,
  ) {}

  async parse(
    fileBuffer: Buffer,
    format: StatementFileFormat,
    existingCategoryNames: string[],
  ): Promise<StatementFileParserResult> {
    try {
      return await this.primary.parse(fileBuffer, format, existingCategoryNames);
    } catch (error) {
      console.error(
        "Falha na extração via IA, acionando fallback determinístico:",
        error,
      );
      return this.fallback.parse(fileBuffer, format, existingCategoryNames);
    }
  }
}
