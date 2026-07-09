import { describe, expect, it, beforeEach } from "vitest";
import { InMemoryRecurringTransactionsRepository } from "../in-memory-recurring-transactions-repository";
import { FetchRecurringTransactionUseCase } from "../../../../../src/modules/recurring-transactions/use-cases/fetch-recurring-transaction";
import { ResourceNotFoundError } from "../../../../../src/core/errors/resource-not-found-error";

let recurringTransactionsRepository: InMemoryRecurringTransactionsRepository;
let sut: FetchRecurringTransactionUseCase;

describe("FetchRecurringTransactionUseCase", () => {
  beforeEach(() => {
    recurringTransactionsRepository =
      new InMemoryRecurringTransactionsRepository();
    sut = new FetchRecurringTransactionUseCase(recurringTransactionsRepository);
  });

  it("retorna a recorrência quando ela pertence ao usuário", async () => {
    const created = await recurringTransactionsRepository.create({
      description: "Netflix",
      amount: 55.9,
      type: "EXPENSE",
      frequency: "MONTHLY",
      startDate: "2026-01-05T00:00:00.000Z",
      userId: "user-1",
      categoryId: "category-1",
    });

    const result = await sut.execute({
      recurringTransactionId: created.id,
      userId: "user-1",
    });

    expect(result.id).toEqual(created.id);
  });

  it("lança ResourceNotFoundError quando a recorrência não existe", async () => {
    await expect(() =>
      sut.execute({ recurringTransactionId: "inexistente", userId: "user-1" }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it("lança ResourceNotFoundError quando a recorrência é de outro usuário", async () => {
    const created = await recurringTransactionsRepository.create({
      description: "Netflix",
      amount: 55.9,
      type: "EXPENSE",
      frequency: "MONTHLY",
      startDate: "2026-01-05T00:00:00.000Z",
      userId: "user-1",
      categoryId: "category-1",
    });

    await expect(() =>
      sut.execute({ recurringTransactionId: created.id, userId: "user-2" }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
