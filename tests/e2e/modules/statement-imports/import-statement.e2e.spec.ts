import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  app,
  buildMultipartFilePayload,
  cleanDatabase,
  createAndAuthenticateUser,
} from "../../setup";

const FIXTURES_DIR = join(__dirname, "fixtures");

describe("POST /v1/statement-imports", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each(["pdf", "xlsx", "csv", "ofx", "bbt", "txt"])(
    "retorna 201 com as transações extraídas para um arquivo .%s",
    async (extension) => {
      const { token } = await createAndAuthenticateUser();
      const fileContent = readFileSync(
        join(FIXTURES_DIR, `extrato.${extension}`),
      );

      const { payload, headers } = buildMultipartFilePayload(
        `extrato.${extension}`,
        fileContent,
      );

      const response = await app.inject({
        method: "POST",
        url: "/v1/statement-imports",
        headers: { authorization: `Bearer ${token}`, ...headers },
        payload,
      });

      expect(response.statusCode).toEqual(201);
      const body = response.json();
      expect(body.statementImport.status).toEqual("READY_FOR_REVIEW");
      expect(body.extractedTransactions).toHaveLength(2);
    },
  );

  it("retorna 201 com status NO_TRANSACTIONS_FOUND quando o arquivo não tem lançamentos", async () => {
    const { token } = await createAndAuthenticateUser();
    const { payload, headers } = buildMultipartFilePayload(
      "vazio.txt",
      readFileSync(join(FIXTURES_DIR, "vazio.txt")),
    );

    const response = await app.inject({
      method: "POST",
      url: "/v1/statement-imports",
      headers: { authorization: `Bearer ${token}`, ...headers },
      payload,
    });

    expect(response.statusCode).toEqual(201);
    const body = response.json();
    expect(body.statementImport.status).toEqual("NO_TRANSACTIONS_FOUND");
    expect(body.extractedTransactions).toHaveLength(0);
  });

  it("retorna 400 para extensão de arquivo não suportada", async () => {
    const { token } = await createAndAuthenticateUser();
    const { payload, headers } = buildMultipartFilePayload(
      "extrato.docx",
      Buffer.from("conteúdo"),
    );

    const response = await app.inject({
      method: "POST",
      url: "/v1/statement-imports",
      headers: { authorization: `Bearer ${token}`, ...headers },
      payload,
    });

    expect(response.statusCode).toEqual(400);
  });

  it("retorna 400 para arquivo acima do limite de tamanho configurado", async () => {
    const { token } = await createAndAuthenticateUser();
    const oversizedContent = Buffer.alloc(11 * 1024 * 1024, "a");
    const { payload, headers } = buildMultipartFilePayload(
      "extrato.csv",
      oversizedContent,
    );

    const response = await app.inject({
      method: "POST",
      url: "/v1/statement-imports",
      headers: { authorization: `Bearer ${token}`, ...headers },
      payload,
    });

    expect(response.statusCode).toEqual(400);
  });

  it("retorna 401 quando não autenticado", async () => {
    const { payload, headers } = buildMultipartFilePayload(
      "extrato.csv",
      Buffer.from("conteúdo"),
    );

    const response = await app.inject({
      method: "POST",
      url: "/v1/statement-imports",
      headers,
      payload,
    });

    expect(response.statusCode).toEqual(401);
  });
});
