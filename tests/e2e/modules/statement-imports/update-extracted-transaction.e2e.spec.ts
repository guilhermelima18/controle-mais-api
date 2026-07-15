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

describe("PATCH /v1/statement-imports/:id/extracted-transactions/:extractedTransactionId", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await app.close();
  });

  it("retorna 200 e persiste a edição no caminho feliz", async () => {
    const { token } = await createAndAuthenticateUser();
    const { statementImportId, extractedTransactionId } = await importStatement(token);

    const response = await app.inject({
      method: "PATCH",
      url: `/v1/statement-imports/${statementImportId}/extracted-transactions/${extractedTransactionId}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { amount: 149.9 },
    });

    expect(response.statusCode).toEqual(200);
    expect(Number(response.json().amount)).toEqual(149.9);
  });

  it("retorna 400 para amount inválido", async () => {
    const { token } = await createAndAuthenticateUser();
    const { statementImportId, extractedTransactionId } = await importStatement(token);

    const response = await app.inject({
      method: "PATCH",
      url: `/v1/statement-imports/${statementImportId}/extracted-transactions/${extractedTransactionId}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { amount: -10 },
    });

    expect(response.statusCode).toEqual(400);
  });

  it("retorna 400 para categoryId inexistente", async () => {
    const { token } = await createAndAuthenticateUser();
    const { statementImportId, extractedTransactionId } = await importStatement(token);

    const response = await app.inject({
      method: "PATCH",
      url: `/v1/statement-imports/${statementImportId}/extracted-transactions/${extractedTransactionId}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { categoryId: "inexistente" },
    });

    expect(response.statusCode).toEqual(400);
  });

  it("retorna 200 quando o categoryId informado existe", async () => {
    const { token } = await createAndAuthenticateUser();
    const categoryId = await createCategory(token);
    const { statementImportId, extractedTransactionId } = await importStatement(token);

    const response = await app.inject({
      method: "PATCH",
      url: `/v1/statement-imports/${statementImportId}/extracted-transactions/${extractedTransactionId}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { categoryId },
    });

    expect(response.statusCode).toEqual(200);
    expect(response.json().categoryId).toEqual(categoryId);
  });

  it("retorna 404 quando o import pertence a outro usuário", async () => {
    const userA = await createAndAuthenticateUser();
    const userB = await createAndAuthenticateUser();
    const { statementImportId, extractedTransactionId } = await importStatement(
      userA.token,
    );

    const response = await app.inject({
      method: "PATCH",
      url: `/v1/statement-imports/${statementImportId}/extracted-transactions/${extractedTransactionId}`,
      headers: { authorization: `Bearer ${userB.token}` },
      payload: { amount: 1 },
    });

    expect(response.statusCode).toEqual(404);
  });
});
