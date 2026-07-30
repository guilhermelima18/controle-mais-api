import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  app,
  cleanDatabase,
  createAndAuthenticateUser,
  createCategory,
} from "../../setup";
import { ProcessRecurringTransactionsUseCase } from "../../../../src/modules/recurring-transactions/use-cases/process-recurring-transactions";
import { PrismaRecurringTransactionsRepository } from "../../../../src/modules/recurring-transactions/repositories/prisma/prisma-recurring-transactions-repository";
import { PrismaTransactionsRepository } from "../../../../src/modules/transactions/repositories/prisma/prisma-transactions-repository";

function daysFromNow(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

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
        startDate: daysFromNow(-1).toISOString(),
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

  it("retorna 404 quando a categoria não existe", async () => {
    const { token } = await createAndAuthenticateUser();

    const response = await app.inject({
      method: "POST",
      url: "/v1/recurring-transactions",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        description: "Netflix",
        amount: 55.9,
        type: "EXPENSE",
        frequency: "MONTHLY",
        startDate: daysFromNow(-1).toISOString(),
        categoryId: "categoria-inexistente",
      },
    });

    expect(response.statusCode).toEqual(404);
  });

  it("materializa o lançamento devido e o expõe no extrato imediatamente", async () => {
    const { token } = await createAndAuthenticateUser();
    const categoryId = await createCategory(token);
    const startDate = daysFromNow(-1);

    const response = await app.inject({
      method: "POST",
      url: "/v1/recurring-transactions",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        description: "Netflix",
        amount: 55.9,
        type: "EXPENSE",
        frequency: "MONTHLY",
        startDate: startDate.toISOString(),
        categoryId,
      },
    });

    expect(response.statusCode).toEqual(201);

    const body = response.json();
    expect(body.createdTransactions).toHaveLength(1);
    expect(body.createdTransactions[0]).toEqual(
      expect.objectContaining({
        description: "Netflix",
        type: "EXPENSE",
        date: startDate.toISOString(),
        categoryId,
        recurringTransactionId: body.recurringTransaction.id,
      }),
    );
    expect(body.recurringTransaction.lastGeneratedDate).toEqual(
      startDate.toISOString(),
    );

    // SC-001: o lançamento está no extrato na primeira consulta, sem esperar o job.
    const listResponse = await app.inject({
      method: "GET",
      url: "/v1/transactions",
      headers: { authorization: `Bearer ${token}` },
    });

    expect(listResponse.statusCode).toEqual(200);
    expect(listResponse.json().data).toHaveLength(1);
    expect(listResponse.json().data[0].description).toBe("Netflix");
  });

  it("não lança nada no extrato quando a recorrência começa no futuro", async () => {
    const { token } = await createAndAuthenticateUser();
    const categoryId = await createCategory(token);

    const response = await app.inject({
      method: "POST",
      url: "/v1/recurring-transactions",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        description: "Academia",
        amount: 120,
        type: "EXPENSE",
        frequency: "MONTHLY",
        startDate: daysFromNow(7).toISOString(),
        categoryId,
      },
    });

    expect(response.statusCode).toEqual(201);
    expect(response.json().createdTransactions).toHaveLength(0);
    expect(response.json().recurringTransaction.lastGeneratedDate).toBeNull();

    const listResponse = await app.inject({
      method: "GET",
      url: "/v1/transactions",
      headers: { authorization: `Bearer ${token}` },
    });

    expect(listResponse.json().data).toHaveLength(0);
  });

  it("recupera todos os ciclos vencidos de uma recorrência iniciada no passado", async () => {
    const { token } = await createAndAuthenticateUser();
    const categoryId = await createCategory(token);

    const response = await app.inject({
      method: "POST",
      url: "/v1/recurring-transactions",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        description: "Café",
        amount: 12.5,
        type: "EXPENSE",
        frequency: "DAILY",
        startDate: daysFromNow(-2).toISOString(),
        categoryId,
      },
    });

    expect(response.statusCode).toEqual(201);
    // Dois dias atrás, ontem e hoje.
    expect(response.json().createdTransactions).toHaveLength(3);
  });

  it("não duplica lançamentos quando o job executa logo após o cadastro", async () => {
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
        startDate: daysFromNow(-1).toISOString(),
        categoryId,
      },
    });

    expect(response.json().createdTransactions).toHaveLength(1);

    // SC-003: contra o Postgres real, o job rodando em seguida não recria o ciclo.
    const { generatedTransactionsCount } =
      await new ProcessRecurringTransactionsUseCase(
        new PrismaRecurringTransactionsRepository(),
        new PrismaTransactionsRepository(),
      ).execute();

    expect(generatedTransactionsCount).toBe(0);

    const listResponse = await app.inject({
      method: "GET",
      url: "/v1/transactions",
      headers: { authorization: `Bearer ${token}` },
    });

    expect(listResponse.json().meta.totalItems).toBe(1);
  });

  it("não expõe a outro usuário o lançamento gerado no cadastro", async () => {
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
        startDate: daysFromNow(-1).toISOString(),
        categoryId,
      },
    });

    const { token: otherToken } = await createAndAuthenticateUser();

    const listResponse = await app.inject({
      method: "GET",
      url: "/v1/transactions",
      headers: { authorization: `Bearer ${otherToken}` },
    });

    expect(listResponse.json().data).toHaveLength(0);
  });
});
