-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "instrument" TEXT NOT NULL,
    "pin" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "phone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'CULTO',
    "status" TEXT NOT NULL DEFAULT 'PLANEJADO',
    "date" DATETIME NOT NULL,
    "callTime" TEXT,
    "startTime" TEXT,
    "location" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "driveUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Lineup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "instrument" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "note" TEXT,
    "respondedAt" DATETIME,
    CONSTRAINT "Lineup_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Lineup_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Song" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "artist" TEXT,
    "defaultKey" TEXT,
    "bpm" INTEGER,
    "timeSig" TEXT,
    "versionUrl" TEXT,
    "vsUrl" TEXT,
    "chartUrl" TEXT,
    "lyrics" TEXT,
    "tags" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SetlistItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "songId" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "keyUsed" TEXT,
    "bpmUsed" INTEGER,
    "moment" TEXT,
    "notes" TEXT,
    "label" TEXT,
    CONSTRAINT "SetlistItem_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SetlistItem_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'GERAL',
    "priority" TEXT NOT NULL DEFAULT 'MEDIA',
    "done" BOOLEAN NOT NULL DEFAULT false,
    "doneAt" DATETIME,
    "dueDate" DATETIME,
    "position" INTEGER NOT NULL DEFAULT 0,
    "eventId" TEXT,
    "assigneeId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Task_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "Member" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChecklistTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ChecklistTemplateItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GERAL',
    "priority" TEXT NOT NULL DEFAULT 'MEDIA',
    "position" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ChecklistTemplateItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ChecklistTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "description" TEXT,
    "method" TEXT,
    "eventId" TEXT,
    "projectId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetCents" INTEGER NOT NULL,
    "deadline" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RoyaltyEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "platform" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL DEFAULT 0,
    "streams" INTEGER,
    "songId" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RoyaltyEntry_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Feedback_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Feedback_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Member_active_idx" ON "Member"("active");

-- CreateIndex
CREATE INDEX "Event_date_idx" ON "Event"("date");

-- CreateIndex
CREATE INDEX "Event_status_idx" ON "Event"("status");

-- CreateIndex
CREATE INDEX "Lineup_eventId_idx" ON "Lineup"("eventId");

-- CreateIndex
CREATE INDEX "Lineup_memberId_idx" ON "Lineup"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "Lineup_eventId_memberId_instrument_key" ON "Lineup"("eventId", "memberId", "instrument");

-- CreateIndex
CREATE INDEX "Song_title_idx" ON "Song"("title");

-- CreateIndex
CREATE INDEX "SetlistItem_eventId_idx" ON "SetlistItem"("eventId");

-- CreateIndex
CREATE INDEX "SetlistItem_songId_idx" ON "SetlistItem"("songId");

-- CreateIndex
CREATE INDEX "Task_eventId_idx" ON "Task"("eventId");

-- CreateIndex
CREATE INDEX "Task_assigneeId_idx" ON "Task"("assigneeId");

-- CreateIndex
CREATE INDEX "Task_done_idx" ON "Task"("done");

-- CreateIndex
CREATE INDEX "ChecklistTemplateItem_templateId_idx" ON "ChecklistTemplateItem"("templateId");

-- CreateIndex
CREATE INDEX "Transaction_date_idx" ON "Transaction"("date");

-- CreateIndex
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");

-- CreateIndex
CREATE INDEX "Transaction_eventId_idx" ON "Transaction"("eventId");

-- CreateIndex
CREATE INDEX "RoyaltyEntry_period_idx" ON "RoyaltyEntry"("period");

-- CreateIndex
CREATE INDEX "RoyaltyEntry_platform_idx" ON "RoyaltyEntry"("platform");

-- CreateIndex
CREATE INDEX "Feedback_eventId_idx" ON "Feedback"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "Feedback_eventId_memberId_sector_key" ON "Feedback"("eventId", "memberId", "sector");
