import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "./generated/client";

const connectionString =
	process.env.DATABASE_URL || "postgresql://root:root@localhost:5432/myhouse";

// biome-ignore lint/suspicious/noExplicitAny: Dynamic prisma type for test/prod
type PrismaType = PrismaClient | any;

export const db: { prisma: PrismaType } = {
	prisma: {} as PrismaType,
};

if (connectionString) {
	const pool = new Pool({ connectionString });
	const adapter = new PrismaPg(pool);
	db.prisma = new PrismaClient({ adapter });
}

export const prisma = new Proxy({} as PrismaType, {
	get(_target, prop) {
		return (db.prisma as Record<string | symbol, unknown>)[prop];
	},
});
