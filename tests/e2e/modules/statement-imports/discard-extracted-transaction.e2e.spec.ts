import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  app,
  buildMultipartFilePayload,
  cleanDatabase,
  createAndAuthenticateUser,
} from "../../setup";

async function importStatement(token: string) {
  const { payload, headers } = buildMultipartFilePayload(
    "extrato.csv",
    "2026-07-01,Mercado,100.00,EXPENSE",
  );

  const response = await app.inject({
    method: "POST",
    url: "/v1/statement-imports",
    headers: { authorization: `Bearer ${token}`, ...headers },
    payload,
  });

  const body = response.json();
  return {
    statementImportId: body.statementImport.id as string,
    extractedTransactionId: body.extractedTransactions[0].id as string,
  };
}

describe("DELETE /v1/statement-imports/:id/extracted-transactions/:extractedTransactionId", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await app.close();
  });

  it("retorna 204 e marca o item como descartado no caminho feliz", async () => {
    const { token } = await createAndAuthenticateUser();
    const { statementImportId, extractedTransactionId } = await importStatement(token);

    const response = await app.inject({
      method: "DELETE",
      url: `/v1/statement-imports/${statementImportId}/extracted-transactions/${extractedTransactionId}`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toEqual(204);

    const getResponse = await app.inject({
      method: "GET",
      url: `/v1/statement-imports/${statementImportId}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(getResponse.json().extractedTransactions[0].discarded).toEqual(true);
  });

  it("retorna 404 quando o import pertence a outro usuário", async () => {
    const userA = await createAndAuthenticateUser();
    const userB = await createAndAuthenticateUser();
    const { statementImportId, extractedTransactionId } = await importStatement(
      userA.token,
    );

    const response = await app.inject({
      method: "DELETE",
      url: `/v1/statement-imports/${statementImportId}/extracted-transactions/${extractedTransactionId}`,
      headers: { authorization: `Bearer ${userB.token}` },
    });

    expect(response.statusCode).toEqual(404);
  });
});
