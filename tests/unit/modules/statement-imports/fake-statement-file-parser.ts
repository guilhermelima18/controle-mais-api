import {
  IStatementFileParser,
  StatementFileParserResult,
} from "../../../../src/modules/statement-imports/providers/istatement-file-parser";

export class FakeStatementFileParser implements IStatementFileParser {
  constructor(
    private behavior:
      | { kind: "succeed"; result: StatementFileParserResult }
      | { kind: "fail"; error: Error },
  ) {}

  async parse(): Promise<StatementFileParserResult> {
    if (this.behavior.kind === "fail") {
      throw this.behavior.error;
    }

    return this.behavior.result;
  }
}
