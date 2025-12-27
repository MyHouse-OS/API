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

// Mock du module prisma/db avec différents chemins pour compatibilité cross-platform
// Le chemin relatif fonctionne depuis les fichiers de test
mock.module("../../prisma/db", () => ({
	prisma: mockPrisma,
}));

// Mock également avec le chemin depuis la racine du projet (pour le preload)
mock.module("./prisma/db", () => ({
	prisma: mockPrisma,
}));

// Mock pour les imports absolus potentiels
mock.module("prisma/db", () => ({
	prisma: mockPrisma,
}));
