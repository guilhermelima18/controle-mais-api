import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import { env } from "../../config/env";

const connectionString = `${env.databaseUrl}`;

const adapter = new PrismaPg({ connectionString });
export const prisma = new PrismaClient({ adapter });
