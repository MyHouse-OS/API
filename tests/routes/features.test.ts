import { beforeEach, describe, expect, it, mock } from "bun:test";
import { encrypt } from "../../src/utils/crypto";

const mockState = {
	id: 1,
	temperature: "20.5",
	light: false,
	door: true,
	heat: false,
};

const encryptedUserToken = encrypt("Token");

const mockPrisma = {
	client: {
		findUnique: mock(() => Promise.resolve({ ClientID: "User", ClientToken: encryptedUserToken })),
		findFirst: mock(() => Promise.resolve(null)),
		upsert: mock(() => Promise.resolve({})),
	},
	homeState: {
		upsert: mock((args) => {
			const updated = { ...mockState, ...(args.update || {}) };
			return Promise.resolve(updated);
		}),
		update: mock((args) => {
			const updated = { ...mockState, ...(args.data || {}) };
			return Promise.resolve(updated);
		}),
		findUnique: mock(() => Promise.resolve(mockState)),
		findFirst: mock(() => Promise.resolve(mockState)),
	},
	history: {
		create: mock(() => Promise.resolve({ id: 1 })),
		findMany: mock(() => Promise.resolve([])),
	},
	$queryRaw: mock(() => Promise.resolve([1])),
};

mock.module("../../prisma/db", () => ({
	prisma: mockPrisma,
}));

describe("Toggle & Temp Routes", async () => {
	const { app } = await import("../../index");
	const authHeader = { Authorization: "User:Token" };

	beforeEach(() => {
		Object.assign(mockState, {
			id: 1,
			temperature: "20.5",
			light: false,
			door: true,
			heat: false,
		});

		mockPrisma.client.findUnique = mock(() =>
			Promise.resolve({ ClientID: "User", ClientToken: encryptedUserToken }),
		);
		mockPrisma.client.findFirst = mock(() => Promise.resolve(null));
		mockPrisma.client.upsert = mock(() => Promise.resolve({}));
		mockPrisma.homeState.upsert = mock((args) => {
			const updated = { ...mockState, ...(args.update || {}) };
			return Promise.resolve(updated);
		});
		mockPrisma.homeState.update = mock((args) => {
			const updated = { ...mockState, ...(args.data || {}) };
			return Promise.resolve(updated);
		});
		mockPrisma.homeState.findUnique = mock(() => Promise.resolve({ ...mockState }));
		mockPrisma.homeState.findFirst = mock(() => Promise.resolve({ ...mockState }));
		mockPrisma.history.create = mock(() => Promise.resolve({ id: 1 }));
		mockPrisma.history.findMany = mock(() => Promise.resolve([]));
		mockPrisma.$queryRaw = mock(() => Promise.resolve([1]));
	});

	it("GET /temp returns current temp", async () => {
		const response = await app.handle(
			new Request("http://localhost/temp", { headers: authHeader }),
		);
		expect(response.status).toBe(200);
		const json = await response.json();
		expect(json.temp).toBe("20.5");
		expect(json).toMatchSnapshot();
	});

	it("POST /temp updates temp", async () => {
		const response = await app.handle(
			new Request("http://localhost/temp", {
				method: "POST",
				headers: { ...authHeader, "Content-Type": "application/json" },
				body: JSON.stringify({ temp: "25.0" }),
			}),
		);
		expect(response.status).toBe(200);
		const json = await response.json();
		expect(json.temp).toBe("25.0");
		expect(json).toMatchSnapshot();
	});

	it("GET /toggle/light returns state", async () => {
		const response = await app.handle(
			new Request("http://localhost/toggle/light", { headers: authHeader }),
		);
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchSnapshot();
	});

	it("POST /toggle/light toggles state", async () => {
		const response = await app.handle(
			new Request("http://localhost/toggle/light", {
				method: "POST",
				headers: authHeader,
			}),
		);
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchSnapshot();
	});

	it("POST /toggle/door toggles state", async () => {
		const response = await app.handle(
			new Request("http://localhost/toggle/door", {
				method: "POST",
				headers: authHeader,
			}),
		);
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchSnapshot();
	});

	it("POST /toggle/heat toggles state", async () => {
		const response = await app.handle(
			new Request("http://localhost/toggle/heat", {
				method: "POST",
				headers: authHeader,
			}),
		);
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchSnapshot();
	});

	it("GET /toggle/door returns door status", async () => {
		const response = await app.handle(
			new Request("http://localhost/toggle/door", { headers: authHeader }),
		);
		expect(response.status).toBe(200);
		const json = await response.json();
		expect(json).toHaveProperty("door");
		expect(json).toMatchSnapshot();
	});

	it("GET /toggle/heat returns heat status", async () => {
		const response = await app.handle(
			new Request("http://localhost/toggle/heat", { headers: authHeader }),
		);
		expect(response.status).toBe(200);
		const json = await response.json();
		expect(json).toHaveProperty("heat");
		expect(json).toMatchSnapshot();
	});

	it("GET /toggle/door handles Prisma errors (500)", async () => {
		mockPrisma.homeState.upsert = mock(() => Promise.reject(new Error("Database error")));

		const response = await app.handle(
			new Request("http://localhost/toggle/door", { headers: authHeader }),
		);
		expect(response.status).toBe(500);
		const json = await response.json();
		expect(json.status).toBe("SERVER_ERROR");

		mockPrisma.homeState.upsert = mock((args) => {
			const updated = { ...mockState, ...(args.update || {}) };
			return Promise.resolve(updated);
		});
	});

	it("POST /temp handles Prisma errors (500)", async () => {
		mockPrisma.homeState.upsert = mock(() => Promise.reject(new Error("Database error")));

		const response = await app.handle(
			new Request("http://localhost/temp", {
				method: "POST",
				headers: { ...authHeader, "Content-Type": "application/json" },
				body: JSON.stringify({ temp: "25.0" }),
			}),
		);
		expect(response.status).toBe(500);
		const json = await response.json();
		expect(json.status).toBe("SERVER_ERROR");

		mockPrisma.homeState.upsert = mock((args) => {
			const updated = { ...mockState, ...(args.update || {}) };
			return Promise.resolve(updated);
		});
	});
});
