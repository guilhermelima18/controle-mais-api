import { prisma } from "../../../../infra/database/prisma";
import { StatementImport } from "../../entities/statement-import";
import {
  IStatementImportsRepository,
  StatementImportCreateData,
  StatementImportUpdateData,
} from "../istatement-imports-repository";

function toEntity(statementImport: {
  id: string;
  fileName: string;
  fileFormat: string;
  fileContent: Uint8Array;
  status: string;
  extractionMethod: string | null;
  failureReason: string | null;
  userId: string;
  createdAt: Date;
  confirmedAt: Date | null;
}): StatementImport {
  return new StatementImport({
    ...statementImport,
    fileFormat: statementImport.fileFormat as StatementImport["fileFormat"],
    status: statementImport.status as StatementImport["status"],
    extractionMethod:
      statementImport.extractionMethod as StatementImport["extractionMethod"],
    fileContent: Buffer.from(statementImport.fileContent),
  });
}

export class PrismaStatementImportsRepository
  implements IStatementImportsRepository
{
  async create(data: StatementImportCreateData): Promise<StatementImport> {
    const statementImport = await prisma.statementImport.create({
      data: { ...data, fileContent: new Uint8Array(data.fileContent) },
    });
    return toEntity(statementImport);
  }

  async update(
    statementImportId: string,
    data: StatementImportUpdateData,
  ): Promise<StatementImport> {
    const statementImport = await prisma.statementImport.update({
      where: { id: statementImportId },
      data,
    });
    return toEntity(statementImport);
  }

  async findByIdAndUser(
    statementImportId: string,
    userId: string,
  ): Promise<StatementImport | null> {
    const statementImport = await prisma.statementImport.findUnique({
      where: { id: statementImportId, userId },
    });
    return statementImport ? toEntity(statementImport) : null;
  }
}
