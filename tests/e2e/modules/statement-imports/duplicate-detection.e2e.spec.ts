import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  app,
  buildMultipartFilePayload,
  cleanDatabase,
  createAndAuthenticateUser,
  createCategory,
} from "../../setup";

const FILE_CONTENT = "2026-07-01,SUPERMERCADO ABC,150.32,EXPENSE";

describe("Detecção de duplicatas ao reimportar um extrato", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await app.close();
  });

  it("sinaliza isDuplicate: true ao reimportar um extrato já confirmado", async () => {
    const { token } = await createAndAuthenticateUser();
    const categoryId = await createCategory(token);

    const { payload, headers } = buildMultipartFilePayload(
      "extrato.csv",
      FILE_CONTENT,
    );
    const firstImport = await app.inject({
      method: "POST",
      url: "/v1/statement-imports",
      headers: { authorization: `Bearer ${token}`, ...headers },
      payload,
    });
    const firstBody = firstImport.json();

    await app.inject({
      method: "PATCH",
      url: `/v1/statement-imports/${firstBody.statementImport.id}/extracted-transactions/${firstBody.extractedTransactions[0].id}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { categoryId },
    });

    await app.inject({
      method: "POST",
      url: `/v1/statement-imports/${firstBody.statementImport.id}/confirm`,
      headers: { authorization: `Bearer ${token}` },
    });

    const { payload: secondPayload, headers: secondHeaders } =
      buildMultipartFilePayload("extrato.csv", FILE_CONTENT);
    const secondImport = await app.inject({
      method: "POST",
      url: "/v1/statement-imports",
      headers: { authorization: `Bearer ${token}`, ...secondHeaders },
      payload: secondPayload,
    });

    expect(secondImport.statusCode).toEqual(201);
    expect(secondImport.json().extractedTransactions[0].isDuplicate).toEqual(true);
  });
});
