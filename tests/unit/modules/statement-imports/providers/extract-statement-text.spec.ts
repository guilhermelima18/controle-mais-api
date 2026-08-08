import { describe, expect, it, vi } from "vitest";
import * as XLSX from "xlsx";
import { extractStatementText } from "../../../../../src/modules/statement-imports/providers/extract-statement-text";

const pdfParseMock = vi.fn();
vi.mock("pdf-parse", () => ({ default: (...args: unknown[]) => pdfParseMock(...args) }));

describe("extractStatementText", () => {
  it("retorna o texto puro para CSV", async () => {
    const text = await extractStatementText(
      Buffer.from("data,descricao,valor\n2026-07-01,Mercado,100.00"),
      "CSV",
    );

    expect(text).toContain("Mercado");
  });

  it("retorna o texto puro para TXT", async () => {
    const text = await extractStatementText(Buffer.from("linha de extrato"), "TXT");
    expect(text).toEqual("linha de extrato");
  });

  it("faz fallback para Latin-1 quando UTF-8 produz caractere de substituição", async () => {
    const latin1Buffer = Buffer.from("Descrição com acentuação", "latin1");
    const text = await extractStatementText(latin1Buffer, "TXT");
    expect(text).toContain("Descrição");
  });

  it("converte XLSX para texto (CSV por planilha)", async () => {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([
      ["data", "descricao", "valor"],
      ["2026-07-01", "Mercado", "100"],
    ]);
    XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");
    const fileBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    const text = await extractStatementText(fileBuffer, "XLSX");

    expect(text).toContain("Mercado");
  });

  it("retorna string vazia para PDF sem camada de texto (escaneado)", async () => {
    pdfParseMock.mockResolvedValueOnce({ text: "" });
    const text = await extractStatementText(Buffer.from("pdf bytes"), "PDF");
    expect(text).toEqual("");
  });

  it("propaga erro quando o PDF está corrompido/não pôde ser lido", async () => {
    pdfParseMock.mockRejectedValueOnce(new Error("bad XRef entry"));
    await expect(
      extractStatementText(Buffer.from("pdf bytes corrompidos"), "PDF"),
    ).rejects.toThrow("bad XRef entry");
  });

  it("remove bytes nulos do texto (Postgres rejeita 0x00 em colunas de texto)", async () => {
    const bufferWithNullBytes = Buffer.from("2026-07-01\u0000,Mercado\u0000,100.00");
    const text = await extractStatementText(bufferWithNullBytes, "TXT");
    expect(text).not.toContain("\u0000");
    expect(text).toEqual("2026-07-01,Mercado,100.00");
  });
});
