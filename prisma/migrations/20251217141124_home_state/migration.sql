-- CreateTable
CREATE TABLE "HomeState" (
    "id" SERIAL NOT NULL,
    "temperature" TEXT NOT NULL,
    "light" BOOLEAN NOT NULL DEFAULT false,
    "door" BOOLEAN NOT NULL DEFAULT false,
    "heat" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HomeState_pkey" PRIMARY KEY ("id")
);
