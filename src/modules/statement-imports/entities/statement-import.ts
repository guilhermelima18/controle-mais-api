export type StatementFileFormat = "PDF" | "XLSX" | "CSV" | "OFX" | "BBT" | "TXT";

export type StatementImportStatus =
  | "RECEIVED"
  | "PROCESSING"
  | "READY_FOR_REVIEW"
  | "NO_TRANSACTIONS_FOUND"
  | "CONFIRMED"
  | "FAILED";

export type StatementExtractionMethod = "AI" | "FALLBACK";

export interface StatementImportProps {
  id: string;
  fileName: string;
  fileFormat: StatementFileFormat;
  fileContent: Buffer;
  status: StatementImportStatus;
  extractionMethod: StatementExtractionMethod | null;
  failureReason: string | null;
  userId: string;
  createdAt: Date;
  confirmedAt: Date | null;
}

export class StatementImport {
  private props: StatementImportProps;

  constructor(props: StatementImportProps) {
    this.props = props;
  }

  get id() {
    return this.props.id;
  }

  get fileName() {
    return this.props.fileName;
  }

  get fileFormat() {
    return this.props.fileFormat;
  }

  get fileContent() {
    return this.props.fileContent;
  }

  get status() {
    return this.props.status;
  }

  get extractionMethod() {
    return this.props.extractionMethod;
  }

  get failureReason() {
    return this.props.failureReason;
  }

  get userId() {
    return this.props.userId;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get confirmedAt() {
    return this.props.confirmedAt;
  }

  toJSON() {
    return {
      id: this.props.id,
      fileName: this.props.fileName,
      fileFormat: this.props.fileFormat,
      status: this.props.status,
      extractionMethod: this.props.extractionMethod,
      failureReason: this.props.failureReason,
      userId: this.props.userId,
      createdAt: this.props.createdAt,
      confirmedAt: this.props.confirmedAt,
    };
  }
}
