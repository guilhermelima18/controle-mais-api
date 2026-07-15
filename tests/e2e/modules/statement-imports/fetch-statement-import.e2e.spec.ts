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

  return response.json().statementImport.id as string;
}

describe("GET /v1/statement-imports/:id", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await app.close();
  });

  it("retorna 200 com o import e as transações extraídas no caminho feliz", async () => {
    const { token } = await createAndAuthenticateUser();
    const statementImportId = await importStatement(token);

    const response = await app.inject({
      method: "GET",
      url: `/v1/statement-imports/${statementImportId}`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toEqual(200);
    expect(response.json().statementImport.id).toEqual(statementImportId);
  });

  it("retorna 404 quando o import pertence a outro usuário", async () => {
    const userA = await createAndAuthenticateUser();
    const userB = await createAndAuthenticateUser();
    const statementImportId = await importStatement(userA.token);

    const response = await app.inject({
      method: "GET",
      url: `/v1/statement-imports/${statementImportId}`,
      headers: { authorization: `Bearer ${userB.token}` },
    });

    expect(response.statusCode).toEqual(404);
  });

  it("retorna 401 sem autenticação", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/statement-imports/qualquer-id",
    });

    expect(response.statusCode).toEqual(401);
  });
});
