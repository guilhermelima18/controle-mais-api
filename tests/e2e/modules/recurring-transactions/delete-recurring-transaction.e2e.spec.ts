import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  app,
  cleanDatabase,
  createAndAuthenticateUser,
  createCategory,
} from "../../setup";

async function createRecurringTransaction(token: string, categoryId: string) {
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

  return list.json().data[0].id as string;
}

describe("DELETE /v1/recurring-transactions/:id", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await app.close();
  });

  it("retorna 200 e remove a recorrência no caminho feliz", async () => {
    const { token } = await createAndAuthenticateUser();
    const categoryId = await createCategory(token);
    const recurringTransactionId = await createRecurringTransaction(
      token,
      categoryId,
    );

    const response = await app.inject({
      method: "DELETE",
      url: `/v1/recurring-transactions/${recurringTransactionId}`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toEqual(200);

    const getAfterDelete = await app.inject({
      method: "GET",
      url: `/v1/recurring-transactions/${recurringTransactionId}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(getAfterDelete.statusCode).toEqual(404);
  });

  it("retorna 404 quando a recorrência é de outro usuário", async () => {
    const owner = await createAndAuthenticateUser();
    const categoryId = await createCategory(owner.token);
    const recurringTransactionId = await createRecurringTransaction(
      owner.token,
      categoryId,
    );

    const intruder = await createAndAuthenticateUser();

    const response = await app.inject({
      method: "DELETE",
      url: `/v1/recurring-transactions/${recurringTransactionId}`,
      headers: { authorization: `Bearer ${intruder.token}` },
    });

    expect(response.statusCode).toEqual(404);
  });
});
