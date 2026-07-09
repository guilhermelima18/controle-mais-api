import { describe, expect, it, beforeEach } from "vitest";
import { InMemoryRecurringTransactionsRepository } from "../in-memory-recurring-transactions-repository";
import { FetchRecurringTransactionsUseCase } from "../../../../../src/modules/recurring-transactions/use-cases/fetch-recurring-transactions";

let recurringTransactionsRepository: InMemoryRecurringTransactionsRepository;
let sut: FetchRecurringTransactionsUseCase;

describe("FetchRecurringTransactionsUseCase", () => {
  beforeEach(() => {
    recurringTransactionsRepository =
      new InMemoryRecurringTransactionsRepository();
    sut = new FetchRecurringTransactionsUseCase(
      recurringTransactionsRepository,
    );
  });

  it("lista apenas as recorrências do usuário informado", async () => {
    await recurringTransactionsRepository.create({
      description: "Netflix",
      amount: 55.9,
      type: "EXPENSE",
      frequency: "MONTHLY",
      startDate: "2026-01-05T00:00:00.000Z",
      userId: "user-1",
      categoryId: "category-1",
    });
    await recurringTransactionsRepository.create({
      description: "Aluguel",
      amount: 1500,
      type: "EXPENSE",
      frequency: "MONTHLY",
      startDate: "2026-01-05T00:00:00.000Z",
      userId: "user-2",
      categoryId: "category-1",
    });

    const result = await sut.execute({ userId: "user-1" });

    expect(result).toHaveLength(1);
    expect(result[0].description).toEqual("Netflix");
  });
});
