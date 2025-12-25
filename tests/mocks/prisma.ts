import { mock } from "bun:test";

// Mock Prisma centralisé partagé par tous les tests
// Chaque test peut réinitialiser les implémentations dans beforeEach

export const mockPrisma = {
	client: {
		findUnique: mock(() => Promise.resolve(null)),
		findFirst: mock(() => Promise.resolve(null)),
		upsert: mock(() => Promise.resolve({})),
	},
	homeState: {
		upsert: mock(() =>
			Promise.resolve({ id: 1, temperature: "20", light: false, door: false, heat: false }),
		),
		update: mock(() =>
			Promise.resolve({ id: 1, temperature: "20", light: false, door: false, heat: false }),
		),
		findFirst: mock(() =>
			Promise.resolve({ id: 1, temperature: "20", light: false, door: false, heat: false }),
		),
		findUnique: mock(() =>
			Promise.resolve({ id: 1, temperature: "20", light: false, door: false, heat: false }),
		),
	},
	history: {
		create: mock(() => Promise.resolve({ id: 1 })),
		findMany: mock(() => Promise.resolve([])),
	},
	$queryRaw: mock(() => Promise.resolve([1])),
};

// Déclaration du mock global - exécutée une seule fois
mock.module("../../prisma/db", () => ({
	prisma: mockPrisma,
}));
