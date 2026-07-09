import { describe, expect, it, beforeEach } from "vitest";
import { InMemoryRecurringTransactionsRepository } from "../in-memory-recurring-transactions-repository";
import { InMemoryCategoriesRepository } from "../../categories/in-memory-categories-repository";
import { UpdateRecurringTransactionUseCase } from "../../../../../src/modules/recurring-transactions/use-cases/update-recurring-transaction";
import { ResourceNotFoundError } from "../../../../../src/core/errors/resource-not-found-error";
import { CategoryNotFoundError } from "../../../../../src/modules/recurring-transactions/use-cases/errors/category-not-found-error";
import { InvalidEndDateError } from "../../../../../src/modules/recurring-transactions/use-cases/errors/invalid-end-date-error";

let recurringTransactionsRepository: InMemoryRecurringTransactionsRepository;
let categoriesRepository: InMemoryCategoriesRepository;
let sut: UpdateRecurringTransactionUseCase;

describe("UpdateRecurringTransactionUseCase", () => {
  beforeEach(() => {
    recurringTransactionsRepository =
      new InMemoryRecurringTransactionsRepository();
    categoriesRepository = new InMemoryCategoriesRepository();
    sut = new UpdateRecurringTransactionUseCase(
      recurringTransactionsRepository,
      categoriesRepository,
    );
  });

  it("atualiza uma recorrência do usuário", async () => {
    const created = await recurringTransactionsRepository.create({
      description: "Netflix",
      amount: 55.9,
      type: "EXPENSE",
      frequency: "MONTHLY",
      startDate: "2026-01-05T00:00:00.000Z",
      userId: "user-1",
      categoryId: "category-1",
    });

    const updated = await sut.execute({
      recurringTransactionId: created.id,
      userId: "user-1",
      data: { amount: 60.5 },
    });

    expect(Number(updated.amount)).toEqual(60.5);
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
      sut.execute({
        recurringTransactionId: created.id,
        userId: "user-2",
        data: { amount: 60.5 },
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it("lança CategoryNotFoundError quando a categoria informada não existe", async () => {
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
      sut.execute({
        recurringTransactionId: created.id,
        userId: "user-1",
        data: { categoryId: "categoria-inexistente" },
      }),
    ).rejects.toBeInstanceOf(CategoryNotFoundError);
  });

  it("lança InvalidEndDateError quando endDate não é posterior a startDate", async () => {
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
      sut.execute({
        recurringTransactionId: created.id,
        userId: "user-1",
        data: { endDate: "2026-01-01T00:00:00.000Z" },
      }),
    ).rejects.toBeInstanceOf(InvalidEndDateError);
  });
});
