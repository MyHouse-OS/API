import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "./generated/client";

const connectionString = process.env.DATABASE_URL;

// biome-ignore lint/suspicious/noExplicitAny: Stub type for test environment
let prisma: PrismaClient | any;

if (connectionString) {
	// Production/Development: use real database connection
	const pool = new Pool({ connectionString });
	const adapter = new PrismaPg(pool);
	prisma = new PrismaClient({ adapter });
} else {
	// Test environment: create a stub that will be replaced by mocks
	// This avoids PrismaClient initialization errors when DATABASE_URL is not set
	prisma = {} as PrismaClient;
}

export { prisma };
