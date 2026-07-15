import OpenAI from "openai";
import { z } from "zod";
import { StatementFileFormat } from "../../entities/statement-import";
import {
  IStatementFileParser,
  StatementFileParserResult,
} from "../istatement-file-parser";
import { extractStatementText } from "../extract-statement-text";

const parsedTransactionSchema = z.object({
  date: z.string(),
  description: z.string(),
  amount: z.number().positive(),
  type: z.enum(["INCOME", "EXPENSE"]),
  suggestedCategoryName: z.string().optional(),
});

const parsedTransactionsResponseSchema = z.object({
  transactions: z.array(parsedTransactionSchema),
});

const RESPONSE_JSON_SCHEMA = {
  name: "statement_transactions",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      transactions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            date: { type: "string", description: "Data no formato ISO 8601 (YYYY-MM-DD)" },
            description: { type: "string" },
            amount: { type: "number", description: "Valor positivo do lançamento" },
            type: { type: "string", enum: ["INCOME", "EXPENSE"] },
            suggestedCategoryName: { type: "string" },
          },
          required: ["date", "description", "amount", "type"],
        },
      },
    },
    required: ["transactions"],
  },
} as const;

/**
 * Adapter que usa o GPT-5-Mini (OpenAI) como intérprete primário do extrato. Qualquer
 * falha (rede, serviço, limite de tokens, resposta que não valida) propaga para que
 * `StatementFileParserWithFallback` acione o parser determinístico (research.md, Decisões
 * 1, 3, 10).
 */
export class OpenAIStatementFileParser implements IStatementFileParser {
  constructor(
    private client: Pick<OpenAI, "chat">,
    private model: string,
  ) {}

  async parse(
    fileBuffer: Buffer,
    format: StatementFileFormat,
    existingCategoryNames: string[],
  ): Promise<StatementFileParserResult> {
    const text = await extractStatementText(fileBuffer, format);

    if (!text.trim()) {
      return { transactions: [], method: "AI" };
    }

    const completion = await this.client.chat.completions.create({
      model: this.model,
      response_format: {
        type: "json_schema",
        json_schema: RESPONSE_JSON_SCHEMA,
      },
      messages: [
        {
          role: "system",
          content:
            "Você extrai lançamentos financeiros (data, descrição, valor e tipo) de " +
            "extratos bancários. Responda apenas com o JSON solicitado, sem texto " +
            "adicional. Para cada lançamento, informe type como INCOME (receita) ou " +
            "EXPENSE (despesa) com base no sinal/natureza do valor. Quando possível, " +
            "sugira em suggestedCategoryName o nome mais adequado dentre as categorias " +
            `existentes a seguir, ou omita o campo se nenhuma se aplicar: ${existingCategoryNames.join(", ")}.`,
        },
        {
          role: "user",
          content: text,
        },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      throw new Error("OpenAI response has no content.");
    }

    const parsed = parsedTransactionsResponseSchema.safeParse(
      JSON.parse(rawContent),
    );

    if (!parsed.success) {
      throw new Error("OpenAI response failed schema validation.");
    }

    return { transactions: parsed.data.transactions, method: "AI" };
  }
}
