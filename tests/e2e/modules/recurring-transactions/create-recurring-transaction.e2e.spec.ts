import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  app,
  cleanDatabase,
  createAndAuthenticateUser,
  createCategory,
} from "../../setup";

describe("POST /v1/recurring-transactions", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await app.close();
  });

  it("retorna 201 e cria a recorrência no caminho feliz", async () => {
    const { token } = await createAndAuthenticateUser();
    const categoryId = await createCategory(token);

    const response = await app.inject({
      method: "POST",
      url: "/v1/recurring-transactions",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        description: "Netflix",
        amount: 55.9,
        type: "EXPENSE",
        frequency: "MONTHLY",
        startDate: "2026-01-05T00:00:00.000Z",
        categoryId,
      },
    });

    expect(response.statusCode).toEqual(201);
    expect(response.json()).toEqual(
      expect.objectContaining({ success: true }),
    );
  });

  it("retorna 400 quando o corpo é inválido", async () => {
    const { token } = await createAndAuthenticateUser();

    const response = await app.inject({
      method: "POST",
      url: "/v1/recurring-transactions",
      headers: { authorization: `Bearer ${token}` },
      payload: { description: "Netflix" },
    });

    expect(response.statusCode).toEqual(400);
  });

  it("retorna 401 quando não autenticado", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/recurring-transactions",
      payload: {},
    });

    expect(response.statusCode).toEqual(401);
  });
});
