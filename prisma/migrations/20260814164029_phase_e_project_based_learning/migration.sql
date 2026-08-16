-- CreateTable
CREATE TABLE "ProjectSkill" (
    "projectId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,

    PRIMARY KEY ("projectId", "skillId"),
    CONSTRAINT "ProjectSkill_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectMilestoneProgress" (
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "milestoneIndex" INTEGER NOT NULL,
    "completedAt" DATETIME,

    PRIMARY KEY ("userId", "projectId", "milestoneIndex"),
    CONSTRAINT "ProjectMilestoneProgress_userId_projectId_fkey" FOREIGN KEY ("userId", "projectId") REFERENCES "UserProject" ("userId", "projectId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "skillId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT '',
    "difficulty" TEXT NOT NULL DEFAULT 'Beginner',
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 60,
    "order" INTEGER NOT NULL DEFAULT 0,
    "objectives" TEXT NOT NULL DEFAULT '[]',
    "requirements" TEXT NOT NULL DEFAULT '[]',
    "hints" TEXT NOT NULL DEFAULT '[]',
    "milestones" TEXT NOT NULL DEFAULT '[]',
    "expectedOutput" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Project_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("createdAt", "description", "difficulty", "estimatedMinutes", "expectedOutput", "hints", "id", "milestones", "objectives", "requirements", "skillId", "title") SELECT "createdAt", "description", "difficulty", "estimatedMinutes", "expectedOutput", "hints", "id", "milestones", "objectives", "requirements", "skillId", "title" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE TABLE "new_UserProject" (
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "startedAt" DATETIME,
    "notes" TEXT NOT NULL DEFAULT '',
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,

    PRIMARY KEY ("userId", "projectId"),
    CONSTRAINT "UserProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserProject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserProject" ("completed", "completedAt", "projectId", "userId") SELECT "completed", "completedAt", "projectId", "userId" FROM "UserProject";
DROP TABLE "UserProject";
ALTER TABLE "new_UserProject" RENAME TO "UserProject";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
