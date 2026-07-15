-- CreateEnum
CREATE TYPE "StatementFileFormat" AS ENUM ('PDF', 'XLSX', 'CSV', 'OFX', 'BBT', 'TXT');

-- CreateEnum
CREATE TYPE "StatementImportStatus" AS ENUM ('RECEIVED', 'PROCESSING', 'READY_FOR_REVIEW', 'NO_TRANSACTIONS_FOUND', 'CONFIRMED', 'FAILED');

-- CreateEnum
CREATE TYPE "StatementExtractionMethod" AS ENUM ('AI', 'FALLBACK');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "extractedTransactionId" TEXT;

-- CreateTable
CREATE TABLE "StatementImport" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileFormat" "StatementFileFormat" NOT NULL,
    "fileContent" BYTEA NOT NULL,
    "status" "StatementImportStatus" NOT NULL DEFAULT 'RECEIVED',
    "extractionMethod" "StatementExtractionMethod",
    "failureReason" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "StatementImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtractedTransaction" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "isDuplicate" BOOLEAN NOT NULL DEFAULT false,
    "discarded" BOOLEAN NOT NULL DEFAULT false,
    "statementImportId" TEXT NOT NULL,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExtractedTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_extractedTransactionId_key" ON "Transaction"("extractedTransactionId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_extractedTransactionId_fkey" FOREIGN KEY ("extractedTransactionId") REFERENCES "ExtractedTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatementImport" ADD CONSTRAINT "StatementImport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractedTransaction" ADD CONSTRAINT "ExtractedTransaction_statementImportId_fkey" FOREIGN KEY ("statementImportId") REFERENCES "StatementImport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractedTransaction" ADD CONSTRAINT "ExtractedTransaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

