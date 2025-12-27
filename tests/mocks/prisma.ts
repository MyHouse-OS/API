import { mock } from "bun:test";
import { fileURLToPath } from "node:url";

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

// Obtenir le chemin du module prisma/db de manière cross-platform
// import.meta.resolve retourne une URL (file://...), on la convertit en chemin
const prismaDbUrl = import.meta.resolve("../../prisma/db");
const prismaDbPath = fileURLToPath(prismaDbUrl);

// Mock avec le chemin du fichier (sans extension, Bun la résout)
mock.module(prismaDbPath, () => ({
	prisma: mockPrisma,
}));

// Mock aussi avec l'URL directement au cas où Bun l'utilise en interne
mock.module(prismaDbUrl, () => ({
	prisma: mockPrisma,
}));
