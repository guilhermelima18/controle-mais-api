import { PrismaRecurringTransactionsRepository } from "../../modules/recurring-transactions/repositories/prisma/prisma-recurring-transactions-repository";
import { PrismaTransactionsRepository } from "../../modules/transactions/repositories/prisma/prisma-transactions-repository";
import { ProcessRecurringTransactionsUseCase } from "../../modules/recurring-transactions/use-cases/process-recurring-transactions";

async function run() {
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
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[process-recurring-transactions] Falha na execução:", error);
    process.exit(1);
  });
