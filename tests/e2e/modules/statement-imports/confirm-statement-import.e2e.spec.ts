import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  app,
  buildMultipartFilePayload,
  cleanDatabase,
  createAndAuthenticateUser,
  createCategory,
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

describe("POST /v1/statement-imports/:id/confirm", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await app.close();
  });

  it("retorna 200 e cria a transação real, visível em GET /v1/transactions", async () => {
    const { token } = await createAndAuthenticateUser();
    const categoryId = await createCategory(token);
    const { statementImportId, extractedTransactionId } = await importStatement(token);

    await app.inject({
      method: "PATCH",
      url: `/v1/statement-imports/${statementImportId}/extracted-transactions/${extractedTransactionId}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { categoryId },
    });

    const confirmResponse = await app.inject({
      method: "POST",
      url: `/v1/statement-imports/${statementImportId}/confirm`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(confirmResponse.statusCode).toEqual(200);
    const confirmBody = confirmResponse.json();
    expect(confirmBody.statementImport.status).toEqual("CONFIRMED");
    expect(confirmBody.createdTransactions).toHaveLength(1);

    const transactionsResponse = await app.inject({
      method: "GET",
      url: "/v1/transactions",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(transactionsResponse.json().data).toHaveLength(1);
  });

  it("retorna 400 quando algum item não descartado está sem categoria", async () => {
    const { token } = await createAndAuthenticateUser();
    const { statementImportId } = await importStatement(token);

    const response = await app.inject({
      method: "POST",
      url: `/v1/statement-imports/${statementImportId}/confirm`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toEqual(400);
  });

  it("retorna 404 quando o import pertence a outro usuário", async () => {
    const userA = await createAndAuthenticateUser();
    const userB = await createAndAuthenticateUser();
    const { statementImportId } = await importStatement(userA.token);

    const response = await app.inject({
      method: "POST",
      url: `/v1/statement-imports/${statementImportId}/confirm`,
      headers: { authorization: `Bearer ${userB.token}` },
    });

    expect(response.statusCode).toEqual(404);
  });
});
