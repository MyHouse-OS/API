import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "./generated/client";

const connectionString = process.env.DATABASE_URL;

// Only create pool and adapter if we have a valid connection string
// In test environments, DATABASE_URL might be empty, so we create a basic client
// that will be mocked by the test setup
let prisma: PrismaClient;

if (connectionString) {
	const pool = new Pool({ connectionString });
	const adapter = new PrismaPg(pool);
	prisma = new PrismaClient({ adapter });
} else {
	// Create basic PrismaClient without adapter - will be mocked in tests
	prisma = new PrismaClient();
}

export { prisma };
