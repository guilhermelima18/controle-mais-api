import "dotenv/config";

if (process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
}

process.env.STATEMENT_IMPORT_USE_FAKE_AI_PROVIDER = "true";
