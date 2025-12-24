import { describe, expect, it, mock } from "bun:test";
import { encrypt } from "../../src/utils/crypto";

const encryptedUserToken = encrypt("Token");

const mockPrisma = {
	client: {
		findUnique: mock(() => Promise.resolve({ ClientID: "User", ClientToken: encryptedUserToken })),
	},
	history: {
		findMany: mock((args) => {
			const limit = args?.take || 50;
			const records = Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
				id: i + 1,
				type: i % 2 === 0 ? "TEMPERATURE" : "LIGHT",
				value: i % 2 === 0 ? "20.5" : "true",
				createdAt: new Date(Date.now() - i * 1000),
			}));
			return Promise.resolve(records);
		}),
	},
};

mock.module("../../prisma/db", () => ({
	prisma: mockPrisma,
}));

describe("History Route", async () => {
	const { app } = await import("../../index");
	const authHeader = { Authorization: "User:Token" };

	it("GET /history with default limit (50)", async () => {
		const response = await app.handle(
			new Request("http://localhost/history", { headers: authHeader }),
		);
		expect(response.status).toBe(200);
		const json = await response.json();
		expect(json.status).toBe("OK");
		expect(json.data).toBeArray();
		expect(json.count).toBeGreaterThan(0);
		expect(json.data[0]).toHaveProperty("id");
		expect(json.data[0]).toHaveProperty("type");
		expect(json.data[0]).toHaveProperty("value");
		expect(json.data[0]).toHaveProperty("createdAt");
	});

	it("GET /history with custom limit", async () => {
		const response = await app.handle(
			new Request("http://localhost/history?limit=3", { headers: authHeader }),
		);
		expect(response.status).toBe(200);
		const json = await response.json();
		expect(json.status).toBe("OK");
		expect(json.data).toBeArray();
		expect(json.count).toBeGreaterThan(0);
		expect(json.count).toBeLessThanOrEqual(3);
	});

	it("GET /history returns data ordered by date DESC", async () => {
		const response = await app.handle(
			new Request("http://localhost/history?limit=5", { headers: authHeader }),
		);
		expect(response.status).toBe(200);
		const json = await response.json();

		if (json.data.length > 1) {
			const first = new Date(json.data[0].createdAt).getTime();
			const second = new Date(json.data[1].createdAt).getTime();
			expect(first).toBeGreaterThanOrEqual(second);
		}
		expect(json.status).toBe("OK");
	});

	it("GET /history handles Prisma errors (500)", async () => {
		mockPrisma.history.findMany = mock(() =>
			Promise.reject(new Error("Database connection failed")),
		);

		const response = await app.handle(
			new Request("http://localhost/history", { headers: authHeader }),
		);
		expect(response.status).toBe(500);
		const json = await response.json();
		expect(json.status).toBe("SERVER_ERROR");
		expect(json.error).toBe("Internal Server Error");

		mockPrisma.history.findMany = mock((args) => {
			const limit = args?.take || 50;
			const records = Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
				id: i + 1,
				type: i % 2 === 0 ? "TEMPERATURE" : "LIGHT",
				value: i % 2 === 0 ? "20.5" : "true",
				createdAt: new Date(Date.now() - i * 1000),
			}));
			return Promise.resolve(records);
		});
	});

	it("GET /history requires authentication (401)", async () => {
		const response = await app.handle(new Request("http://localhost/history"));
		expect(response.status).toBe(401);
		expect(await response.text()).toBe("Authorization header missing");
	});

	it("GET /history with invalid limit (NaN) uses default", async () => {
		const response = await app.handle(
			new Request("http://localhost/history?limit=invalid", {
				headers: authHeader,
			}),
		);
		expect(response.status).toBe(200);
		const json = await response.json();
		expect(json.status).toBe("OK");
		expect(json.data).toBeArray();
		expect(json.count).toBeGreaterThan(0);
	});
});
