import OpenAI from "openai";
import { env } from "../../../config/env";
import { IStatementFileParser } from "./istatement-file-parser";
import { FakeStatementFileParser } from "./fake/fake-statement-file-parser";
import { OpenAIStatementFileParser } from "./openai/openai-statement-file-parser";
import { DeterministicStatementFileParser } from "./deterministic/deterministic-statement-file-parser";
import { StatementFileParserWithFallback } from "./statement-file-parser-with-fallback";

/**
 * Controllers desta feature MUST usar esta factory em vez de instanciar um provider
 * diretamente, para que os testes automatizados nunca cheguem a chamar a API real da
 * OpenAI (research.md, Decisão 11).
 */
export function makeStatementFileParser(): IStatementFileParser {
  if (env.useFakeAiProvider) {
    return new FakeStatementFileParser();
  }

  const openaiClient = new OpenAI({ apiKey: env.openaiApiKey });

  return new StatementFileParserWithFallback(
    new OpenAIStatementFileParser(openaiClient, env.openaiModel),
    new DeterministicStatementFileParser(),
  );
}
