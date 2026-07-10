import { PrismaRecurringTransactionsRepository } from "../../modules/recurring-transactions/repositories/prisma/prisma-recurring-transactions-repository";
import { PrismaTransactionsRepository } from "../../modules/transactions/repositories/prisma/prisma-transactions-repository";
import { ProcessRecurringTransactionsUseCase } from "../../modules/recurring-transactions/use-cases/process-recurring-transactions";

export async function runProcessRecurringTransactionsJob() {
  const recurringTransactionsRepository =
    new PrismaRecurringTransactionsRepository();
  const transactionsRepository = new PrismaTransactionsRepository();
  const processRecurringTransactionsUseCase =
    new ProcessRecurringTransactionsUseCase(
      recurringTransactionsRepository,
      transactionsRepository,
    );

  const { generatedTransactionsCount } =
    await processRecurringTransactionsUseCase.execute();

  console.log(
    `[process-recurring-transactions] ${generatedTransactionsCount} transação(ões) gerada(s).`,
  );

  return { generatedTransactionsCount };
}
