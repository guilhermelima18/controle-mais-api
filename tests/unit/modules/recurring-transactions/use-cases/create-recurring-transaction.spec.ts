import { describe, expect, it, beforeEach } from "vitest";
import { InMemoryRecurringTransactionsRepository } from "../in-memory-recurring-transactions-repository";
import { InMemoryTransactionsRepository } from "../../transactions/in-memory-transactions-repository";
import { InMemoryCategoriesRepository } from "../../categories/in-memory-categories-repository";
import { CreateRecurringTransactionUseCase } from "../../../../../src/modules/recurring-transactions/use-cases/create-recurring-transaction";
import { ProcessRecurringTransactionsUseCase } from "../../../../../src/modules/recurring-transactions/use-cases/process-recurring-transactions";
import { CategoryNotFoundError } from "../../../../../src/modules/recurring-transactions/use-cases/errors/category-not-found-error";
import { InvalidEndDateError } from "../../../../../src/modules/recurring-transactions/use-cases/errors/invalid-end-date-error";

let transactionsRepository: InMemoryTransactionsRepository;
let recurringTransactionsRepository: InMemoryRecurringTransactionsRepository;
let categoriesRepository: InMemoryCategoriesRepository;
let sut: CreateRecurringTransactionUseCase;

describe("CreateRecurringTransactionUseCase", () => {
  beforeEach(() => {
    transactionsRepository = new InMemoryTransactionsRepository();
    recurringTransactionsRepository =
      new InMemoryRecurringTransactionsRepository(transactionsRepository);
    categoriesRepository = new InMemoryCategoriesRepository();
    sut = new CreateRecurringTransactionUseCase(
      recurringTransactionsRepository,
      categoriesRepository,
    );
  });

  async function createCategory() {
    return categoriesRepository.create({
      name: "Assinaturas",
      type: "EXPENSE",
    });
  }

  it("cria uma recorrência quando a categoria existe", async () => {
    const category = await createCategory();

    const { recurringTransaction } = await sut.execute({
      description: "Netflix",
      amount: 55.9,
      type: "EXPENSE",
      frequency: "MONTHLY",
      startDate: "2026-01-05T00:00:00.000Z",
      userId: "user-1",
      categoryId: category.id,
      referenceDate: new Date("2026-01-05T12:00:00.000Z"),
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
    const category = await createCategory();

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

  it("não gera nenhuma transação quando nenhum erro de domínio ocorre mas a categoria falha antes", async () => {
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

    // FR-010: as validações rodam ANTES de qualquer lançamento ser gerado.
    expect(recurringTransactionsRepository.items).toHaveLength(0);
    expect(transactionsRepository.items).toHaveLength(0);
  });

  it("materializa o lançamento do ciclo devido quando a recorrência inicia hoje", async () => {
    const category = await createCategory();

    const { recurringTransaction, createdTransactions } = await sut.execute({
      description: "Netflix",
      amount: 55.9,
      type: "EXPENSE",
      frequency: "MONTHLY",
      startDate: "2026-01-05T00:00:00.000Z",
      userId: "user-1",
      categoryId: category.id,
      referenceDate: new Date("2026-01-05T09:30:00.000Z"),
    });

    expect(createdTransactions).toHaveLength(1);
    expect(transactionsRepository.items).toHaveLength(1);

    // FR-003: a data é a de competência do ciclo, não a do cadastro.
    expect(createdTransactions[0].date).toEqual(
      new Date("2026-01-05T00:00:00.000Z"),
    );
    expect(createdTransactions[0].description).toBe("Netflix");
    expect(Number(createdTransactions[0].amount)).toBe(55.9);
    expect(createdTransactions[0].type).toBe("EXPENSE");
    expect(createdTransactions[0].categoryId).toBe(category.id);
    expect(createdTransactions[0].userId).toBe("user-1");

    // FR-004: o lançamento permanece vinculado à recorrência que o originou.
    expect(createdTransactions[0].recurringTransactionId).toBe(
      recurringTransaction.id,
    );

    // FR-006: o progresso avança para o último ciclo gerado.
    expect(recurringTransaction.lastGeneratedDate).toEqual(
      new Date("2026-01-05T00:00:00.000Z"),
    );
  });

  it("não gera nenhum lançamento quando a data de início está no futuro", async () => {
    const category = await createCategory();

    const { recurringTransaction, createdTransactions } = await sut.execute({
      description: "Academia",
      amount: 120,
      type: "EXPENSE",
      frequency: "MONTHLY",
      startDate: "2026-02-05T00:00:00.000Z",
      userId: "user-1",
      categoryId: category.id,
      referenceDate: new Date("2026-01-20T10:00:00.000Z"),
    });

    // FR-005 / US2: antecipar um ciclo futuro corromperia o extrato do mês corrente.
    expect(createdTransactions).toHaveLength(0);
    expect(transactionsRepository.items).toHaveLength(0);
    expect(recurringTransaction.lastGeneratedDate).toBeNull();
  });

  it("recupera todos os ciclos vencidos quando a recorrência começou no passado", async () => {
    const category = await createCategory();

    const { recurringTransaction, createdTransactions } = await sut.execute({
      description: "Aluguel",
      amount: 1800,
      type: "EXPENSE",
      frequency: "MONTHLY",
      startDate: "2025-10-10T00:00:00.000Z",
      userId: "user-1",
      categoryId: category.id,
      referenceDate: new Date("2026-01-15T00:00:00.000Z"),
    });

    // Out, nov, dez e jan já venceram até a data de referência.
    expect(createdTransactions).toHaveLength(4);
    expect(createdTransactions.map((transaction) => transaction.date)).toEqual([
      new Date("2025-10-10T00:00:00.000Z"),
      new Date("2025-11-10T00:00:00.000Z"),
      new Date("2025-12-10T00:00:00.000Z"),
      new Date("2026-01-10T00:00:00.000Z"),
    ]);
    expect(recurringTransaction.lastGeneratedDate).toEqual(
      new Date("2026-01-10T00:00:00.000Z"),
    );
  });

  it("para de gerar no endDate quando o período da recorrência já terminou", async () => {
    const category = await createCategory();

    const { createdTransactions } = await sut.execute({
      description: "Curso",
      amount: 300,
      type: "EXPENSE",
      frequency: "MONTHLY",
      startDate: "2025-10-01T00:00:00.000Z",
      endDate: "2025-12-01T00:00:00.000Z",
      userId: "user-1",
      categoryId: category.id,
      referenceDate: new Date("2026-01-15T00:00:00.000Z"),
    });

    expect(createdTransactions).toHaveLength(3);
    expect(createdTransactions.at(-1)?.date).toEqual(
      new Date("2025-12-01T00:00:00.000Z"),
    );
  });

  it("não duplica lançamentos quando o job executa logo após o cadastro", async () => {
    const category = await createCategory();
    const referenceDate = new Date("2026-01-05T09:30:00.000Z");

    await sut.execute({
      description: "Netflix",
      amount: 55.9,
      type: "EXPENSE",
      frequency: "MONTHLY",
      startDate: "2026-01-05T00:00:00.000Z",
      userId: "user-1",
      categoryId: category.id,
      referenceDate,
    });

    expect(transactionsRepository.items).toHaveLength(1);

    // SC-003: o job rodando em seguida, sem o tempo avançar para o próximo ciclo,
    // não pode criar nada — a idempotência vem do lastGeneratedDate já avançado.
    const processRecurringTransactions = new ProcessRecurringTransactionsUseCase(
      recurringTransactionsRepository,
      transactionsRepository,
    );
    const { generatedTransactionsCount } =
      await processRecurringTransactions.execute(
        new Date("2026-01-05T09:45:00.000Z"),
      );

    expect(generatedTransactionsCount).toBe(0);
    expect(transactionsRepository.items).toHaveLength(1);
  });

  it("gera pelo cadastro exatamente os mesmos ciclos que o job geraria sozinho", async () => {
    const category = await createCategory();
    const referenceDate = new Date("2026-01-15T00:00:00.000Z");
    const input = {
      description: "Aluguel",
      amount: 1800,
      type: "EXPENSE" as const,
      frequency: "MONTHLY" as const,
      startDate: "2025-11-10T00:00:00.000Z",
      userId: "user-1",
      categoryId: category.id,
    };

    // Caminho A: cadastro antecipando a geração.
    const { createdTransactions } = await sut.execute({
      ...input,
      referenceDate,
    });

    // Caminho B: cadastro sem antecipar (como era antes) + job.
    const jobTransactionsRepository = new InMemoryTransactionsRepository();
    const jobRecurringRepository = new InMemoryRecurringTransactionsRepository(
      jobTransactionsRepository,
    );
    await jobRecurringRepository.create(input);
    await new ProcessRecurringTransactionsUseCase(
      jobRecurringRepository,
      jobTransactionsRepository,
    ).execute(referenceDate);

    // FR-002: mesma quantidade e mesmas datas de competência nos dois caminhos.
    expect(createdTransactions.map((transaction) => transaction.date)).toEqual(
      jobTransactionsRepository.items.map((transaction) => transaction.date),
    );
    expect(
      createdTransactions.map((transaction) => Number(transaction.amount)),
    ).toEqual(
      jobTransactionsRepository.items.map((transaction) =>
        Number(transaction.amount),
      ),
    );
  });
});
