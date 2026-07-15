import {
  IStatementFileParser,
  ParsedTransaction,
  StatementFileParserResult,
} from "../istatement-file-parser";

/**
 * Usado apenas quando `env.useFakeAiProvider` é `true` (testes automatizados), nunca em
 * produção. Espera linhas no formato `data,descricao,valor,tipo`, independente do formato
 * declarado do arquivo, para manter os fixtures de teste simples e determinísticos
 * (research.md, Decisão 11).
 */
export class FakeStatementFileParser implements IStatementFileParser {
  async parse(fileBuffer: Buffer): Promise<StatementFileParserResult> {
    const text = fileBuffer.toString("utf-8").trim();

    if (!text) {
      return { transactions: [], method: "AI" };
    }

    const transactions: ParsedTransaction[] = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        const [date, description, amount, type] = line
          .split(",")
          .map((field) => field.trim());

        return {
          date,
          description,
          amount: Number(amount),
          type: type as ParsedTransaction["type"],
        };
      });

    return { transactions, method: "AI" };
  }
}
