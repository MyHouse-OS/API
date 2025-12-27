import { mock } from "bun:test";

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

// Utiliser import.meta.resolve pour obtenir le chemin exact du module
// Cela fonctionne de manière fiable car Bun résout le chemin de la même façon
// que lors de l'import dans le code source
const prismaDbUrl = import.meta.resolve("../../prisma/db");

mock.module(prismaDbUrl, () => ({
	prisma: mockPrisma,
}));
