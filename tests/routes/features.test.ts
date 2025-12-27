import { beforeEach, describe, expect, it } from "bun:test";
import { encrypt } from "../../src/utils/crypto";
import { mockPrisma } from "../mocks/prisma";

const mockState = {
	id: 1,
	temperature: "20",
	light: false,
	door: false,
	heat: false,
};

const encryptedUserToken = encrypt("Token");

// TODO: Ces tests sont skippés car le mocking Prisma ne fonctionne pas de manière fiable
// entre Windows (local) et Linux (CI). À investiguer avec une future version de Bun.
describe.skip("Toggle & Temp Routes", async () => {
	const { app } = await import("../../index");
	const authHeader = { Authorization: "User:Token" };

	beforeEach(() => {
		Object.assign(mockState, {
			id: 1,
			temperature: "20",
			light: false,
			door: false,
			heat: false,
		});

		// Réinitialiser les mocks avec les valeurs de ce test
		mockPrisma.client.findUnique.mockImplementation(() =>
			Promise.resolve({ ClientID: "User", ClientToken: encryptedUserToken } as never),
		);
		mockPrisma.client.findFirst.mockImplementation(() => Promise.resolve(null));
		mockPrisma.client.upsert.mockImplementation(() => Promise.resolve({} as never));

		mockPrisma.homeState.upsert.mockImplementation((args: never) => {
			const updateData = (args as { update?: Record<string, unknown> })?.update;
			// Ne muter mockState que si update contient réellement des données
			if (updateData && Object.keys(updateData).length > 0) {
				Object.assign(mockState, updateData);
			}
			return Promise.resolve({ ...mockState });
		});
		mockPrisma.homeState.update.mockImplementation((args: never) => {
			Object.assign(mockState, (args as { data?: Record<string, unknown> })?.data || {});
			return Promise.resolve({ ...mockState });
		});
		mockPrisma.homeState.findUnique.mockImplementation(() => Promise.resolve({ ...mockState }));
		mockPrisma.homeState.findFirst.mockImplementation(() => Promise.resolve({ ...mockState }));

		mockPrisma.history.create.mockImplementation(() => Promise.resolve({ id: 1 }));
		mockPrisma.history.findMany.mockImplementation(() => Promise.resolve([]));

		mockPrisma.$queryRaw.mockImplementation(() => Promise.resolve([1]));
	});

	it("GET /temp returns current temp", async () => {
		const response = await app.handle(
			new Request("http://localhost/temp", { headers: authHeader }),
		);
		expect(response.status).toBe(200);
		const json = await response.json();
		expect(json.temp).toBe("20");
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
		mockPrisma.homeState.upsert.mockImplementation(() =>
			Promise.reject(new Error("Database error")),
		);

		const response = await app.handle(
			new Request("http://localhost/toggle/door", { headers: authHeader }),
		);
		expect(response.status).toBe(500);
		const json = await response.json();
		expect(json.status).toBe("SERVER_ERROR");
	});

	it("POST /temp handles Prisma errors (500)", async () => {
		mockPrisma.homeState.upsert.mockImplementation(() =>
			Promise.reject(new Error("Database error")),
		);

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
	});
});
