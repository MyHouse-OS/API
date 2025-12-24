import { beforeEach, describe, expect, it, mock } from "bun:test";
import { encrypt } from "../../src/utils/crypto";

const masterToken = encrypt("MasterSecret");

const mockState = {
	id: 1,
	temperature: "20",
	light: false,
	door: false,
	heat: false,
};

const mockClients = new Map<string, { ClientID: string; ClientToken: string }>();
const mockHistory: Array<{
	id: number;
	type: string;
	value: string;
	createdAt: Date;
}> = [];

let historyId = 1;

const mockPrisma = {
	client: {
		findUnique: mock((args) => {
			const client = mockClients.get(args?.where?.ClientID);
			return Promise.resolve(client || null);
		}),
		upsert: mock((args) => {
			const clientId = args.create.ClientID;
			const client = { ClientID: clientId, ClientToken: args.create.ClientToken };
			mockClients.set(clientId, client);
			return Promise.resolve(client);
		}),
	},
	homeState: {
		upsert: mock((args) => {
			if (args.update && Object.keys(args.update).length > 0) {
				Object.assign(mockState, args.update);
			}
			return Promise.resolve({ ...mockState });
		}),
		update: mock((args) => {
			Object.assign(mockState, args.data);
			return Promise.resolve({ ...mockState });
		}),
		findUnique: mock(() => Promise.resolve({ ...mockState })),
	},
	history: {
		create: mock((args) => {
			const record = {
				id: historyId++,
				type: args.data.type,
				value: args.data.value,
				createdAt: new Date(),
			};
			mockHistory.push(record);
			return Promise.resolve(record);
		}),
		findMany: mock((args) => {
			const limit = args?.take || 50;
			return Promise.resolve(mockHistory.slice(-limit).reverse());
		}),
	},
};

mock.module("../../prisma/db", () => ({
	prisma: mockPrisma,
}));

describe("E2E Integration Tests", async () => {
	mockClients.set("MasterServer", {
		ClientID: "MasterServer",
		ClientToken: masterToken,
	});

	const { app } = await import("../../index");

	beforeEach(() => {
		Object.assign(mockState, {
			temperature: "20",
			light: false,
			door: false,
			heat: false,
		});
		mockHistory.length = 0;
		historyId = 1;
		const master = mockClients.get("MasterServer");
		mockClients.clear();
		if (master) {
			mockClients.set("MasterServer", master);
		}
	});

	describe("Complete authentication and toggle flow", () => {
		it("registers client → toggles light → verifies history contains event", async () => {
			const registerResponse = await app.handle(
				new Request("http://localhost/auth", {
					method: "POST",
					headers: {
						Authorization: "MasterServer:MasterSecret",
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ id: "TestClient", token: "TestToken" }),
				}),
			);

			expect(registerResponse.status).toBe(200);
			const registerJson = await registerResponse.json();
			expect(registerJson.client).toBe("TestClient");

			const toggleResponse = await app.handle(
				new Request("http://localhost/toggle/light", {
					method: "POST",
					headers: { Authorization: "TestClient:TestToken" },
				}),
			);

			expect(toggleResponse.status).toBe(200);
			const toggleJson = await toggleResponse.json();
			expect(toggleJson.light).toBe(true);

			const historyResponse = await app.handle(
				new Request("http://localhost/history", {
					headers: { Authorization: "TestClient:TestToken" },
				}),
			);

			expect(historyResponse.status).toBe(200);
			const historyJson = await historyResponse.json();
			expect(historyJson.data.length).toBeGreaterThan(0);

			const lightEvent = historyJson.data.find((e: { type: string }) => e.type === "LIGHT");
			expect(lightEvent).toBeDefined();
			expect(lightEvent.value).toBe("true");
		});
	});

	describe("Multi-step API flows", () => {
		it("temperature update → query state → verify persistence", async () => {
			mockClients.set("TempClient", {
				ClientID: "TempClient",
				ClientToken: encrypt("TempToken"),
			});

			const tempUpdateResponse = await app.handle(
				new Request("http://localhost/temp", {
					method: "POST",
					headers: {
						Authorization: "TempClient:TempToken",
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ temp: "22.5" }),
				}),
			);

			expect(tempUpdateResponse.status).toBe(200);
			const tempUpdateJson = await tempUpdateResponse.json();
			expect(tempUpdateJson.temp).toBe("22.5");

			const tempGetResponse = await app.handle(
				new Request("http://localhost/temp", {
					headers: { Authorization: "TempClient:TempToken" },
				}),
			);

			expect(tempGetResponse.status).toBe(200);
			const tempGetJson = await tempGetResponse.json();
			expect(tempGetJson.temp).toBe("22.5");

			const historyResponse = await app.handle(
				new Request("http://localhost/history", {
					headers: { Authorization: "TempClient:TempToken" },
				}),
			);

			expect(historyResponse.status).toBe(200);
			const historyJson = await historyResponse.json();
			const tempEvent = historyJson.data.find((e: { type: string }) => e.type === "TEMPERATURE");
			expect(tempEvent).toBeDefined();
			expect(tempEvent.value).toBe("22.5");
		});

		it("multiple toggles → history logs all changes", async () => {
			mockClients.set("MultiClient", {
				ClientID: "MultiClient",
				ClientToken: encrypt("MultiToken"),
			});

			await app.handle(
				new Request("http://localhost/toggle/light", {
					method: "POST",
					headers: { Authorization: "MultiClient:MultiToken" },
				}),
			);

			await app.handle(
				new Request("http://localhost/toggle/door", {
					method: "POST",
					headers: { Authorization: "MultiClient:MultiToken" },
				}),
			);

			await app.handle(
				new Request("http://localhost/toggle/heat", {
					method: "POST",
					headers: { Authorization: "MultiClient:MultiToken" },
				}),
			);

			const historyResponse = await app.handle(
				new Request("http://localhost/history", {
					headers: { Authorization: "MultiClient:MultiToken" },
				}),
			);

			const historyJson = await historyResponse.json();
			expect(historyJson.data.length).toBe(3);

			const types = historyJson.data.map((e: { type: string }) => e.type);
			expect(types).toContain("LIGHT");
			expect(types).toContain("DOOR");
			expect(types).toContain("HEAT");
		});

		it("check existing client → verify token decryption", async () => {
			const testToken = "KnownToken123";
			const encryptedTestToken = encrypt(testToken);

			mockClients.set("CheckableClient", {
				ClientID: "CheckableClient",
				ClientToken: encryptedTestToken,
			});

			mockClients.set("CheckerClient", {
				ClientID: "CheckerClient",
				ClientToken: encrypt("CheckerToken"),
			});

			const checkResponse = await app.handle(
				new Request("http://localhost/check?id=CheckableClient", {
					headers: { Authorization: "CheckerClient:CheckerToken" },
				}),
			);

			expect(checkResponse.status).toBe(200);
			const checkJson = await checkResponse.json();
			expect(checkJson.exists).toBe(true);
			expect(checkJson.token).toBe(testToken);
		});

		it("complete state query flow → all endpoints return consistent data", async () => {
			mockClients.set("StateClient", {
				ClientID: "StateClient",
				ClientToken: encrypt("StateToken"),
			});

			Object.assign(mockState, {
				temperature: "21.5",
				light: true,
				door: false,
				heat: true,
			});

			const tempResponse = await app.handle(
				new Request("http://localhost/temp", {
					headers: { Authorization: "StateClient:StateToken" },
				}),
			);
			const tempJson = await tempResponse.json();
			expect(tempJson.temp).toBe("21.5");

			const lightResponse = await app.handle(
				new Request("http://localhost/toggle/light", {
					headers: { Authorization: "StateClient:StateToken" },
				}),
			);
			const lightJson = await lightResponse.json();
			expect(lightJson.light).toBe(true);

			const doorResponse = await app.handle(
				new Request("http://localhost/toggle/door", {
					headers: { Authorization: "StateClient:StateToken" },
				}),
			);
			const doorJson = await doorResponse.json();
			expect(doorJson.door).toBe(false);

			const heatResponse = await app.handle(
				new Request("http://localhost/toggle/heat", {
					headers: { Authorization: "StateClient:StateToken" },
				}),
			);
			const heatJson = await heatResponse.json();
			expect(heatJson.heat).toBe(true);
		});
	});
});
