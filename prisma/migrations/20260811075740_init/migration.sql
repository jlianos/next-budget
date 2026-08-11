-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserWorkspace" (
    "userId" INTEGER NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("userId", "workspaceId"),
    CONSTRAINT "UserWorkspace_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserWorkspace_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Wallet_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TransactionType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TransactionType_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TransactionCategory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "transactionTypeId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TransactionCategory_transactionTypeId_fkey" FOREIGN KEY ("transactionTypeId") REFERENCES "TransactionType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "amount" DECIMAL NOT NULL,
    "walletId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "recurringTransactionId" INTEGER,
    "occurredAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Transaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TransactionCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transaction_recurringTransactionId_fkey" FOREIGN KEY ("recurringTransactionId") REFERENCES "RecurringTransaction" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transfer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "amount" DECIMAL NOT NULL,
    "fromWalletId" INTEGER NOT NULL,
    "toWalletId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "occurredAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Transfer_fromWalletId_fkey" FOREIGN KEY ("fromWalletId") REFERENCES "Wallet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transfer_toWalletId_fkey" FOREIGN KEY ("toWalletId") REFERENCES "Wallet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transfer_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecurringTransaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "amount" DECIMAL NOT NULL,
    "walletId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "frequency" TEXT NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME,
    "nextAt" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RecurringTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RecurringTransaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TransactionCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RecurringTransaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_workspaceId_name_key" ON "Wallet"("workspaceId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionType_workspaceId_name_key" ON "TransactionType"("workspaceId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionCategory_transactionTypeId_name_key" ON "TransactionCategory"("transactionTypeId", "name");

-- CreateIndex
CREATE INDEX "Transaction_walletId_occurredAt_idx" ON "Transaction"("walletId", "occurredAt");

-- CreateIndex
CREATE INDEX "Transaction_categoryId_occurredAt_idx" ON "Transaction"("categoryId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_recurringTransactionId_occurredAt_key" ON "Transaction"("recurringTransactionId", "occurredAt");

-- CreateIndex
CREATE INDEX "Transfer_fromWalletId_occurredAt_idx" ON "Transfer"("fromWalletId", "occurredAt");

-- CreateIndex
CREATE INDEX "Transfer_toWalletId_occurredAt_idx" ON "Transfer"("toWalletId", "occurredAt");

-- CreateIndex
CREATE INDEX "RecurringTransaction_walletId_idx" ON "RecurringTransaction"("walletId");

-- CreateIndex
CREATE INDEX "RecurringTransaction_isActive_nextAt_idx" ON "RecurringTransaction"("isActive", "nextAt");
