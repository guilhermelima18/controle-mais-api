import { randomUUID } from "node:crypto";
import { app } from "../../src/infra/http/app";
import { prisma } from "../../src/infra/database/prisma";

export { app };

export async function cleanDatabase() {
  await prisma.transaction.deleteMany();
  await prisma.recurringTransaction.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
}

export async function createAndAuthenticateUser() {
  const cpf = String(Math.floor(10000000000 + Math.random() * 89999999999));

  await app.inject({
    method: "POST",
    url: "/v1/users",
    payload: {
      name: "Usuário de Teste",
      cpf,
      email: `${randomUUID()}@example.com`,
      password: "123456",
    },
  });

  const authResponse = await app.inject({
    method: "POST",
    url: "/v1/auth",
    payload: { cpf, password: "123456" },
  });

  const { token, user } = authResponse.json();

  return { token, userId: user.id as string };
}

export async function createCategory(
  token: string,
  overrides: Partial<{ name: string; type: "INCOME" | "EXPENSE" }> = {},
) {
  const name = overrides.name ?? `Categoria ${randomUUID()}`;

  await app.inject({
    method: "POST",
    url: "/v1/categories",
    headers: { authorization: `Bearer ${token}` },
    payload: {
      name,
      type: overrides.type ?? "EXPENSE",
    },
  });

  const category = await prisma.category.findUniqueOrThrow({
    where: { name },
  });

  return category.id;
}
