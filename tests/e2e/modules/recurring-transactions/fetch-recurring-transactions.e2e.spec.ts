import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  app,
  cleanDatabase,
  createAndAuthenticateUser,
  createCategory,
} from "../../setup";

afterAll(async () => {
  await app.close();
});

describe("GET /v1/recurring-transactions", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it("lista apenas as recorrências do usuário autenticado", async () => {
    const { token } = await createAndAuthenticateUser();
    const categoryId = await createCategory(token);

    await app.inject({
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

    const response = await app.inject({
      method: "GET",
      url: "/v1/recurring-transactions",
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toEqual(200);
    expect(response.json().data).toHaveLength(1);
  });

  it("retorna 401 sem autenticação", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/recurring-transactions",
    });

    expect(response.statusCode).toEqual(401);
  });
});

describe("GET /v1/recurring-transactions/:id", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it("retorna a recorrência quando ela pertence ao usuário", async () => {
    const { token } = await createAndAuthenticateUser();
    const categoryId = await createCategory(token);

    await app.inject({
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

    const list = await app.inject({
      method: "GET",
      url: "/v1/recurring-transactions",
      headers: { authorization: `Bearer ${token}` },
    });
    const recurringTransactionId = list.json().data[0].id;

    const response = await app.inject({
      method: "GET",
      url: `/v1/recurring-transactions/${recurringTransactionId}`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toEqual(200);
    expect(response.json().description).toEqual("Netflix");
  });

  it("retorna 404 quando a recorrência é de outro usuário", async () => {
    const owner = await createAndAuthenticateUser();
    const categoryId = await createCategory(owner.token);

    await app.inject({
      method: "POST",
      url: "/v1/recurring-transactions",
      headers: { authorization: `Bearer ${owner.token}` },
      payload: {
        description: "Netflix",
        amount: 55.9,
        type: "EXPENSE",
        frequency: "MONTHLY",
        startDate: "2026-01-05T00:00:00.000Z",
        categoryId,
      },
    });

    const list = await app.inject({
      method: "GET",
      url: "/v1/recurring-transactions",
      headers: { authorization: `Bearer ${owner.token}` },
    });
    const recurringTransactionId = list.json().data[0].id;

    const intruder = await createAndAuthenticateUser();

    const response = await app.inject({
      method: "GET",
      url: `/v1/recurring-transactions/${recurringTransactionId}`,
      headers: { authorization: `Bearer ${intruder.token}` },
    });

    expect(response.statusCode).toEqual(404);
  });
});
