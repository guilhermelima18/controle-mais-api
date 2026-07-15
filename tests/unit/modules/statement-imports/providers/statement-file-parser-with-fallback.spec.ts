import { describe, expect, it } from "vitest";
import { StatementFileParserWithFallback } from "../../../../../src/modules/statement-imports/providers/statement-file-parser-with-fallback";
import { FakeStatementFileParser } from "../fake-statement-file-parser";

describe("StatementFileParserWithFallback", () => {
  it("retorna o resultado do primário e não chama o fallback quando o primário sucede", async () => {
    const primary = new FakeStatementFileParser({
      kind: "succeed",
      result: { method: "AI", transactions: [] },
    });
    const fallback = new FakeStatementFileParser({
      kind: "fail",
      error: new Error("fallback não deveria ser chamado"),
    });

    const sut = new StatementFileParserWithFallback(primary, fallback);

    const result = await sut.parse(Buffer.from("x"), "CSV", []);

    expect(result.method).toEqual("AI");
  });

  it("aciona o fallback e retorna method: FALLBACK quando o primário lança erro", async () => {
    const primary = new FakeStatementFileParser({
      kind: "fail",
      error: new Error("IA indisponível"),
    });
    const fallback = new FakeStatementFileParser({
      kind: "succeed",
      result: {
        method: "FALLBACK",
        transactions: [
          { date: "2026-07-01", description: "X", amount: 10, type: "EXPENSE" },
        ],
      },
    });

    const sut = new StatementFileParserWithFallback(primary, fallback);

    const result = await sut.parse(Buffer.from("x"), "CSV", []);

    expect(result.method).toEqual("FALLBACK");
    expect(result.transactions).toHaveLength(1);
  });

  it("propaga o erro do fallback quando ambos falham", async () => {
    const primary = new FakeStatementFileParser({
      kind: "fail",
      error: new Error("IA indisponível"),
    });
    const fallbackError = new Error("fallback também falhou");
    const fallback = new FakeStatementFileParser({
      kind: "fail",
      error: fallbackError,
    });

    const sut = new StatementFileParserWithFallback(primary, fallback);

    await expect(() => sut.parse(Buffer.from("x"), "CSV", [])).rejects.toThrow(
      "fallback também falhou",
    );
  });
});
