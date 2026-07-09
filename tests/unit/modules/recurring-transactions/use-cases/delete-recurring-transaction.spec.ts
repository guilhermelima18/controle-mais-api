import { describe, expect, it, beforeEach } from "vitest";
import { InMemoryRecurringTransactionsRepository } from "../in-memory-recurring-transactions-repository";
import { DeleteRecurringTransactionUseCase } from "../../../../../src/modules/recurring-transactions/use-cases/delete-recurring-transaction";
import { ResourceNotFoundError } from "../../../../../src/core/errors/resource-not-found-error";

let recurringTransactionsRepository: InMemoryRecurringTransactionsRepository;
let sut: DeleteRecurringTransactionUseCase;

describe("DeleteRecurringTransactionUseCase", () => {
  beforeEach(() => {
    recurringTransactionsRepository =
      new InMemoryRecurringTransactionsRepository();
    sut = new DeleteRecurringTransactionUseCase(recurringTransactionsRepository);
  });

  it("remove uma recorrência do usuário", async () => {
    const created = await recurringTransactionsRepository.create({
      description: "Netflix",
      amount: 55.9,
      type: "EXPENSE",
      frequency: "MONTHLY",
      startDate: "2026-01-05T00:00:00.000Z",
      userId: "user-1",
      categoryId: "category-1",
    });

    await sut.execute({ recurringTransactionId: created.id, userId: "user-1" });

    expect(recurringTransactionsRepository.items).toHaveLength(0);
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
