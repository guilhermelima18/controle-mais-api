import {
  StatementExtractionMethod,
  StatementFileFormat,
  StatementImport,
  StatementImportStatus,
} from "../entities/statement-import";

export type StatementImportCreateData = {
  fileName: string;
  fileFormat: StatementFileFormat;
  fileContent: Buffer;
  userId: string;
};

export type StatementImportUpdateData = {
  status?: StatementImportStatus;
  extractionMethod?: StatementExtractionMethod | null;
  failureReason?: string | null;
  confirmedAt?: Date;
};

export interface IStatementImportsRepository {
  create(data: StatementImportCreateData): Promise<StatementImport>;
  update(
    statementImportId: string,
    data: StatementImportUpdateData,
  ): Promise<StatementImport>;
  findByIdAndUser(
    statementImportId: string,
    userId: string,
  ): Promise<StatementImport | null>;
}
