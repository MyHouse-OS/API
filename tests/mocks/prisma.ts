import { mock } from "bun:test";
import { db } from "../../prisma/db";

export const mockPrisma = {
	client: {
		findUnique: mock((..._args: unknown[]) => Promise.resolve(null as unknown)),
		findFirst: mock((..._args: unknown[]) => Promise.resolve(null as unknown)),
		upsert: mock((..._args: unknown[]) => Promise.resolve({} as unknown)),
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

db.prisma = mockPrisma;
