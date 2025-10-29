-- CreateTable
CREATE TABLE "ApprovalRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "site" TEXT NOT NULL,
    "trade" TEXT NOT NULL,
    "tendersIssued" INTEGER NOT NULL,
    "tendersReceived" INTEGER NOT NULL,
    "budgetValue" DECIMAL NOT NULL,
    "estimatedProfit" DECIMAL NOT NULL,
    "comments" TEXT,
    "requesterEmail" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "recommendedBidId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Bid" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "approvalRequestId" TEXT NOT NULL,
    "contractor" TEXT NOT NULL,
    "quote" DECIMAL NOT NULL,
    CONSTRAINT "Bid_approvalRequestId_fkey" FOREIGN KEY ("approvalRequestId") REFERENCES "ApprovalRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApprovalAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "approvalRequestId" TEXT NOT NULL,
    "actorEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApprovalAction_approvalRequestId_fkey" FOREIGN KEY ("approvalRequestId") REFERENCES "ApprovalRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
