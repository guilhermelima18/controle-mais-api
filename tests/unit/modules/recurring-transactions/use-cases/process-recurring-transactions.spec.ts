import { describe, expect, it, beforeEach } from "vitest";
import { InMemoryRecurringTransactionsRepository } from "../in-memory-recurring-transactions-repository";
import { InMemoryTransactionsRepository } from "../../transactions/in-memory-transactions-repository";
import { ProcessRecurringTransactionsUseCase } from "../../../../../src/modules/recurring-transactions/use-cases/process-recurring-transactions";
import { calculateDueCycles } from "../../../../../src/modules/recurring-transactions/use-cases/calculate-due-cycles";

let recurringTransactionsRepository: InMemoryRecurringTransactionsRepository;
let transactionsRepository: InMemoryTransactionsRepository;
let sut: ProcessRecurringTransactionsUseCase;

const REFERENCE_DATE = new Date("2026-01-10T00:00:00.000Z");

describe("calculateDueCycles", () => {
  it("normaliza o mês mais curto ao somar meses (data-fns clamping)", () => {
    const cycles = calculateDueCycles({
      startDate: new Date("2026-01-31T00:00:00.000Z"),
      lastGeneratedDate: null,
      endDate: null,
      frequency: "MONTHLY",
      referenceDate: new Date("2026-03-01T00:00:00.000Z"),
    });

    expect(cycles).toHaveLength(2);
    expect(cycles[0].toISOString()).toEqual("2026-01-31T00:00:00.000Z");
    expect(cycles[1].toISOString()).toEqual("2026-02-28T00:00:00.000Z");
  });
});

describe("ProcessRecurringTransactionsUseCase", () => {
  beforeEach(() => {
    recurringTransactionsRepository =
      new InMemoryRecurringTransactionsRepository();
    transactionsRepository = new InMemoryTransactionsRepository();
    sut = new ProcessRecurringTransactionsUseCase(
      recurringTransactionsRepository,
      transactionsRepository,
    );
  });

  it("gera uma transação para um ciclo vencido e atualiza lastGeneratedDate", async () => {
    const recurringTransaction = await recurringTransactionsRepository.create({
      description: "Netflix",
      amount: 55.9,
      type: "EXPENSE",
      frequency: "MONTHLY",
      startDate: "2026-01-05T00:00:00.000Z",
      userId: "user-1",
      categoryId: "category-1",
    });

    await sut.execute(REFERENCE_DATE);

    expect(transactionsRepository.items).toHaveLength(1);
    expect(transactionsRepository.items[0].date.toISOString()).toEqual(
      "2026-01-05T00:00:00.000Z",
    );
    expect(transactionsRepository.items[0].recurringTransactionId).toEqual(
      recurringTransaction.id,
    );

    const updated = await recurringTransactionsRepository.findByIdAndUser(
      recurringTransaction.id,
      "user-1",
    );
    expect(updated?.lastGeneratedDate?.toISOString()).toEqual(
      "2026-01-05T00:00:00.000Z",
    );
  });

  it("não gera nada quando o ciclo ainda não venceu", async () => {
    await recurringTransactionsRepository.create({
      description: "Netflix",
      amount: 55.9,
      type: "EXPENSE",
      frequency: "MONTHLY",
      startDate: "2026-02-01T00:00:00.000Z",
      userId: "user-1",
      categoryId: "category-1",
    });

    await sut.execute(REFERENCE_DATE);

    expect(transactionsRepository.items).toHaveLength(0);
  });

  it("não duplica quando o processo roda de novo no mesmo ciclo", async () => {
    await recurringTransactionsRepository.create({
      description: "Netflix",
      amount: 55.9,
      type: "EXPENSE",
      frequency: "MONTHLY",
      startDate: "2026-01-05T00:00:00.000Z",
      userId: "user-1",
      categoryId: "category-1",
    });

    await sut.execute(REFERENCE_DATE);
    await sut.execute(REFERENCE_DATE);

    expect(transactionsRepository.items).toHaveLength(1);
  });

  it("não gera nada quando o startDate ainda está no futuro", async () => {
    await recurringTransactionsRepository.create({
      description: "Netflix",
      amount: 55.9,
      type: "EXPENSE",
      frequency: "DAILY",
      startDate: "2026-02-01T00:00:00.000Z",
      userId: "user-1",
      categoryId: "category-1",
    });

    await sut.execute(REFERENCE_DATE);

    expect(transactionsRepository.items).toHaveLength(0);
  });

  it("não gera mais nada quando todos os ciclos até o endDate já foram processados", async () => {
    const recurringTransaction = await recurringTransactionsRepository.create(
      {
        description: "Netflix",
        amount: 55.9,
        type: "EXPENSE",
        frequency: "DAILY",
        startDate: "2026-01-01T00:00:00.000Z",
        endDate: "2026-01-05T00:00:00.000Z",
        userId: "user-1",
        categoryId: "category-1",
      },
    );
    await recurringTransactionsRepository.updateLastGeneratedDate(
      recurringTransaction.id,
      new Date("2026-01-05T00:00:00.000Z"),
    );

    await sut.execute(REFERENCE_DATE);

    expect(transactionsRepository.items).toHaveLength(0);
  });

  it("faz backfill de múltiplos ciclos perdidos, um por dia, e respeita o endDate como teto", async () => {
    await recurringTransactionsRepository.create({
      description: "Assinatura diária",
      amount: 10,
      type: "EXPENSE",
      frequency: "DAILY",
      startDate: "2026-01-01T00:00:00.000Z",
      endDate: "2026-01-03T00:00:00.000Z",
      userId: "user-1",
      categoryId: "category-1",
    });

    await sut.execute(REFERENCE_DATE);

    expect(transactionsRepository.items).toHaveLength(3);
    expect(
      transactionsRepository.items.map((item) => item.date.toISOString()),
    ).toEqual([
      "2026-01-01T00:00:00.000Z",
      "2026-01-02T00:00:00.000Z",
      "2026-01-03T00:00:00.000Z",
    ]);
  });
});
