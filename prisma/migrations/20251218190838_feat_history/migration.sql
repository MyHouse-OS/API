-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('TEMPERATURE', 'LIGHT', 'DOOR', 'HEAT');

-- CreateTable
CREATE TABLE "History" (
    "id" SERIAL NOT NULL,
    "type" "EventType" NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "History_pkey" PRIMARY KEY ("id")
);
