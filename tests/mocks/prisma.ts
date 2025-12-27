import { mock } from "bun:test";
import { db } from "../../prisma/db";

// Mock Prisma centralisé partagé par tous les tests
// Chaque test peut réinitialiser les implémentations dans beforeEach

export const mockPrisma = {
	client: {
		findUnique: mock((..._args: never[]) => Promise.resolve(null)),
		findFirst: mock((..._args: never[]) => Promise.resolve(null)),
		upsert: mock((..._args: never[]) => Promise.resolve({})),
	},
	homeState: {
		upsert: mock((..._args: never[]) =>
			Promise.resolve({ id: 1, temperature: "20", light: false, door: false, heat: false }),
		),
		update: mock((..._args: never[]) =>
			Promise.resolve({ id: 1, temperature: "20", light: false, door: false, heat: false }),
		),
		findFirst: mock((..._args: never[]) =>
			Promise.resolve({ id: 1, temperature: "20", light: false, door: false, heat: false }),
		),
		findUnique: mock((..._args: never[]) =>
			Promise.resolve({ id: 1, temperature: "20", light: false, door: false, heat: false }),
		),
	},
	history: {
		create: mock((..._args: never[]) => Promise.resolve({ id: 1 })),
		findMany: mock((..._args: never[]) => Promise.resolve([])),
	},
	$queryRaw: mock((..._args: never[]) => Promise.resolve([1])),
};

// Injecter le mock directement dans le container db
// Cela fonctionne car prisma est un Proxy qui délègue à db.prisma
db.prisma = mockPrisma;
