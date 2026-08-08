import { PrismaCategoriesRepository } from "../src/modules/categories/repositories/prisma/prisma-categories-repository";
import { CreateCategoryUseCase } from "../src/modules/categories/use-cases/create-category";
import { TransactionType } from "../src/modules/categories/entities/category";

const defaultCategories: { name: string; type: TransactionType }[] = [
  { name: "Salário", type: "INCOME" },
  { name: "Freelance", type: "INCOME" },
  { name: "Investimentos", type: "INCOME" },
  { name: "Rendimentos", type: "INCOME" },
  { name: "Vendas", type: "INCOME" },
  { name: "Presente", type: "INCOME" },
  { name: "Reembolso", type: "INCOME" },
  { name: "Outras Receitas", type: "INCOME" },

  { name: "Moradia", type: "EXPENSE" },
  { name: "Alimentação", type: "EXPENSE" },
  { name: "Transporte", type: "EXPENSE" },
  { name: "Saúde", type: "EXPENSE" },
  { name: "Educação", type: "EXPENSE" },
  { name: "Lazer", type: "EXPENSE" },
  { name: "Vestuário", type: "EXPENSE" },
  { name: "Contas e Serviços", type: "EXPENSE" },
  { name: "Assinaturas", type: "EXPENSE" },
  { name: "Cuidados Pessoais", type: "EXPENSE" },
  { name: "Compras", type: "EXPENSE" },
  { name: "Viagem", type: "EXPENSE" },
  { name: "Pets", type: "EXPENSE" },
  { name: "Impostos e Taxas", type: "EXPENSE" },
  { name: "Doações", type: "EXPENSE" },
  { name: "Outras Despesas", type: "EXPENSE" },
];

async function seed() {
  const categoriesRepository = new PrismaCategoriesRepository();
  const createCategoryUseCase = new CreateCategoryUseCase(
    categoriesRepository,
  );

  const existingCategories = await categoriesRepository.findMany();
  const existingNames = new Set(
    existingCategories.map((category) => category.name),
  );

  let createdCount = 0;

  for (const category of defaultCategories) {
    if (existingNames.has(category.name)) {
      console.log(`[seed] Categoria "${category.name}" já existe, pulando.`);
      continue;
    }

    await createCategoryUseCase.execute(category);
    createdCount += 1;
    console.log(`[seed] Categoria "${category.name}" criada.`);
  }

  console.log(
    `[seed] Concluído: ${createdCount} categoria(s) criada(s), ${
      defaultCategories.length - createdCount
    } já existente(s).`,
  );
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[seed] Falha na execução:", error);
    process.exit(1);
  });
