import { describe, expect, it, vi } from "vitest";
import * as XLSX from "xlsx";
import { DeterministicStatementFileParser } from "../../../../../src/modules/statement-imports/providers/deterministic/deterministic-statement-file-parser";

const pdfParseMock = vi.fn();
vi.mock("pdf-parse", () => ({ default: (...args: unknown[]) => pdfParseMock(...args) }));

const sut = new DeterministicStatementFileParser();

describe("DeterministicStatementFileParser", () => {
  it("extrai transações de um OFX via regex de tags", async () => {
    const ofx = Buffer.from(`
      <OFX>
      <BANKTRANLIST>
      <STMTTRN>
      <TRNTYPE>DEBIT
      <DTPOSTED>20260701
      <TRNAMT>-150.32
      <MEMO>SUPERMERCADO ABC
      </STMTTRN>
      <STMTTRN>
      <TRNTYPE>CREDIT
      <DTPOSTED>20260705
      <TRNAMT>3000.00
      <MEMO>SALARIO
      </STMTTRN>
      </BANKTRANLIST>
      </OFX>
    `);

    const result = await sut.parse(ofx, "OFX", []);

    expect(result.method).toEqual("FALLBACK");
    expect(result.transactions).toHaveLength(2);
    expect(result.transactions[0]).toMatchObject({
      date: "2026-07-01",
      description: "SUPERMERCADO ABC",
      amount: 150.32,
      type: "EXPENSE",
    });
    expect(result.transactions[1]).toMatchObject({
      date: "2026-07-05",
      amount: 3000,
      type: "INCOME",
    });
    expect(result.transactions[0].suggestedCategoryName).toBeUndefined();
  });

  it("extrai transações de um CSV via heurística de colunas", async () => {
    const csv = Buffer.from(
      "data,descricao,valor\n2026-07-01,Mercado,-100.50\n2026-07-02,Salario,2000.00",
    );

    const result = await sut.parse(csv, "CSV", []);

    expect(result.transactions).toHaveLength(2);
    expect(result.transactions[0]).toMatchObject({
      date: "2026-07-01",
      description: "Mercado",
      amount: 100.5,
      type: "EXPENSE",
    });
  });

  it("extrai transações de um XLSX via heurística de colunas", async () => {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([
      ["data", "descricao", "valor"],
      ["2026-07-01", "Mercado", -100.5],
    ]);
    XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");
    const fileBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    const result = await sut.parse(fileBuffer, "XLSX", []);

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].description).toEqual("Mercado");
  });

  it("extrai transações de TXT/BBT via regex genérica de data/valor", async () => {
    const txt = Buffer.from(
      "01/07/2026 SUPERMERCADO ABC R$ -150,32\n05/07/2026 SALARIO R$ 3000,00",
    );

    const result = await sut.parse(txt, "TXT", []);

    expect(result.transactions).toHaveLength(2);
    expect(result.transactions[0]).toMatchObject({
      date: "2026-07-01",
      amount: 150.32,
      type: "EXPENSE",
    });
  });

  it("infere entrada/saída pela variação do saldo quando o valor não tem sinal (ex.: extrato Neon em PDF)", async () => {
    const txt = Buffer.from(
      [
        "Resgate em Cofrinho11/07/2026 R$ 70,00R$ 72,50-",
        "PIX enviado para IFOOD11/07/2026 R$ 68,18R$ 4,32-",
        "PIX recebido de FULANO12/07/2026 R$ 1.000,00R$ 1.004,32-",
        "POSTO ANA CLAUDINA12/07/2026 R$ 50,00R$ 954,32-",
      ].join("\n"),
    );

    const result = await sut.parse(txt, "TXT", []);

    expect(result.transactions).toHaveLength(4);
    expect(result.transactions.map((t) => t.type)).toEqual([
      "INCOME", // sem saldo anterior, cai na palavra-chave "Resgate"
      "EXPENSE", // saldo caiu de 72,50 para 4,32
      "INCOME", // saldo subiu de 4,32 para 1.004,32
      "EXPENSE", // saldo caiu de 1.004,32 para 954,32
    ]);
    expect(result.transactions[0].amount).toEqual(70);
    expect(result.transactions[2].amount).toEqual(1000);
  });

  it("retorna lista vazia para PDF sem camada de texto (escaneado), sem lançar erro", async () => {
    pdfParseMock.mockResolvedValueOnce({ text: "" });
    const result = await sut.parse(Buffer.from("pdf bytes"), "PDF", []);
    expect(result.transactions).toEqual([]);
  });
});
