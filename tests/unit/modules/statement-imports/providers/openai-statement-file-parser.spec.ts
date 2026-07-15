import { describe, expect, it, vi } from "vitest";
import { OpenAIStatementFileParser } from "../../../../../src/modules/statement-imports/providers/openai/openai-statement-file-parser";

function makeFakeOpenAiClient(responseContent: string) {
  return {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: responseContent } }],
        }),
      },
    },
  } as any;
}

describe("OpenAIStatementFileParser", () => {
  it("retorna as transações e method: AI quando a resposta é válida", async () => {
    const client = makeFakeOpenAiClient(
      JSON.stringify({
        transactions: [
          {
            date: "2026-07-01",
            description: "SUPERMERCADO ABC",
            amount: 150.32,
            type: "EXPENSE",
          },
        ],
      }),
    );

    const sut = new OpenAIStatementFileParser(client, "gpt-5-mini");

    const result = await sut.parse(Buffer.from("data,descricao,valor\n2026-07-01,Mercado,100"), "CSV", [
      "Mercado",
    ]);

    expect(result.method).toEqual("AI");
    expect(result.transactions).toHaveLength(1);
    expect(client.chat.completions.create).toHaveBeenCalledOnce();
  });

  it("não chama a API quando o texto extraído está vazio, retornando lista vazia", async () => {
    const client = makeFakeOpenAiClient("{}");
    const sut = new OpenAIStatementFileParser(client, "gpt-5-mini");

    const result = await sut.parse(Buffer.from(""), "TXT", []);

    expect(result).toEqual({ transactions: [], method: "AI" });
    expect(client.chat.completions.create).not.toHaveBeenCalled();
  });

  it("lança erro quando a resposta não valida contra o schema esperado", async () => {
    const client = makeFakeOpenAiClient(JSON.stringify({ oops: true }));
    const sut = new OpenAIStatementFileParser(client, "gpt-5-mini");

    await expect(() =>
      sut.parse(Buffer.from("algum texto"), "TXT", []),
    ).rejects.toThrow();
  });
});
