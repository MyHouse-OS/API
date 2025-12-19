import { describe, expect, it, mock } from "bun:test";
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
		// Middleware uses findUnique now
		findUnique: mock(() => Promise.resolve({ ClientID: "User", ClientToken: encryptedUserToken })),
	},
	homeState: {
		upsert: mock((args) => {
			// If we have update data, merge it. Otherwise return default.
			// args.update contains the updates if record exists (it does in mock)
			const updated = { ...mockState, ...(args.update || {}) };
			return Promise.resolve(updated);
		}),
		update: mock((args) => {
			const updated = { ...mockState, ...(args.data || {}) };
			return Promise.resolve(updated);
		}),
		findUnique: mock(() => Promise.resolve(mockState)),
	},
	history: {
		create: mock(() => Promise.resolve({ id: 1 })),
	},
};

mock.module("../../prisma/db", () => ({
	prisma: mockPrisma,
}));

describe("Toggle & Temp Routes", async () => {
	const { app } = await import("../../index");
	const authHeader = { Authorization: "User:Token" };

	// TEMP
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

	// LIGHT
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

	// DOOR
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

	// HEAT
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
});
