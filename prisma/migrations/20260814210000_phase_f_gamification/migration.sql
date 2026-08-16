-- Phase F: progress + lightweight gamification.
-- Adds streak tracking to User, an idempotency column to XpEvent, and makes
-- XP events unique per (user, reason, reference).

ALTER TABLE "User" ADD COLUMN "currentStreak" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "longestStreak" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "lastActiveDate" DATETIME;

ALTER TABLE "XpEvent" ADD COLUMN "referenceId" TEXT;

CREATE UNIQUE INDEX "XpEvent_userId_reason_referenceId_key" ON "XpEvent"("userId", "reason", "referenceId");
