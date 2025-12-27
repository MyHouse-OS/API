import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "./generated/client";

const connectionString = process.env.DATABASE_URL;

// biome-ignore lint/suspicious/noExplicitAny: Dynamic prisma type for test/prod
type PrismaType = PrismaClient | any;

// Container object - les tests peuvent modifier db.prisma directement
// et tous les modules qui utilisent db.prisma verront le changement
export const db: { prisma: PrismaType } = {
	prisma: {} as PrismaType,
};

if (connectionString) {
	// Production/Development: use real database connection
	const pool = new Pool({ connectionString });
	const adapter = new PrismaPg(pool);
	db.prisma = new PrismaClient({ adapter });
}

// Export pour compatibilité avec le code existant
// Note: cet export est une référence à db.prisma, donc si db.prisma change,
// ce changement sera visible partout
export const prisma = new Proxy({} as PrismaType, {
	get(_target, prop) {
		return (db.prisma as Record<string | symbol, unknown>)[prop];
	},
});
