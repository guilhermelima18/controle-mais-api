import { describe, expect, it, beforeEach } from "vitest";
import { InMemoryRecurringTransactionsRepository } from "../in-memory-recurring-transactions-repository";
import { InMemoryCategoriesRepository } from "../../categories/in-memory-categories-repository";
import { CreateRecurringTransactionUseCase } from "../../../../../src/modules/recurring-transactions/use-cases/create-recurring-transaction";
import { CategoryNotFoundError } from "../../../../../src/modules/recurring-transactions/use-cases/errors/category-not-found-error";
import { InvalidEndDateError } from "../../../../../src/modules/recurring-transactions/use-cases/errors/invalid-end-date-error";

let recurringTransactionsRepository: InMemoryRecurringTransactionsRepository;
let categoriesRepository: InMemoryCategoriesRepository;
let sut: CreateRecurringTransactionUseCase;

describe("CreateRecurringTransactionUseCase", () => {
  beforeEach(() => {
    recurringTransactionsRepository =
      new InMemoryRecurringTransactionsRepository();
    categoriesRepository = new InMemoryCategoriesRepository();
    sut = new CreateRecurringTransactionUseCase(
      recurringTransactionsRepository,
      categoriesRepository,
    );
  });

  it("cria uma recorrência quando a categoria existe", async () => {
    const category = await categoriesRepository.create({
      name: "Assinaturas",
      type: "EXPENSE",
    });

    const recurringTransaction = await sut.execute({
      description: "Netflix",
      amount: 55.9,
      type: "EXPENSE",
      frequency: "MONTHLY",
      startDate: "2026-01-05T00:00:00.000Z",
      userId: "user-1",
      categoryId: category.id,
    });

    expect(recurringTransaction.id).toEqual(expect.any(String));
    expect(recurringTransactionsRepository.items).toHaveLength(1);
  });

  it("lança CategoryNotFoundError quando a categoria não existe", async () => {
    await expect(() =>
      sut.execute({
        description: "Netflix",
        amount: 55.9,
        type: "EXPENSE",
        frequency: "MONTHLY",
        startDate: "2026-01-05T00:00:00.000Z",
        userId: "user-1",
        categoryId: "categoria-inexistente",
      }),
    ).rejects.toBeInstanceOf(CategoryNotFoundError);
  });

  it("lança InvalidEndDateError quando endDate não é posterior a startDate", async () => {
    const category = await categoriesRepository.create({
      name: "Assinaturas",
      type: "EXPENSE",
    });

    await expect(() =>
      sut.execute({
        description: "Netflix",
        amount: 55.9,
        type: "EXPENSE",
        frequency: "MONTHLY",
        startDate: "2026-01-05T00:00:00.000Z",
        endDate: "2026-01-01T00:00:00.000Z",
        userId: "user-1",
        categoryId: category.id,
      }),
    ).rejects.toBeInstanceOf(InvalidEndDateError);
  });
});
