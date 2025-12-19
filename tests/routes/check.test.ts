import { describe, expect, it, mock } from "bun:test";
import { encrypt } from "../../src/utils/crypto";

// Generate a valid encrypted token for "ExistingToken"
const encryptedExistingToken = encrypt("ExistingToken");
// Generate a valid encrypted token for "Secret" (Master)
const encryptedMasterToken = encrypt("Secret");

const mockPrisma = {
	client: {
		findFirst: mock(() =>
			Promise.resolve({ ClientID: "Master", ClientToken: encryptedMasterToken }),
		), // For middleware
		findUnique: mock((args) => {
			if (args.where.ClientID === "ExistingClient") {
				return Promise.resolve({ ClientID: "ExistingClient", ClientToken: encryptedExistingToken });
			}
			// Middleware check inside route check? No, route check uses findUnique for target.
			// Middleware uses findUnique (changed in step 3).
			// Wait, authMiddleware uses findUnique by ID only now!
			if (args.where.ClientID === "Master") {
				return Promise.resolve({ ClientID: "Master", ClientToken: encryptedMasterToken });
			}
			return Promise.resolve(null);
		}),
	},
};

mock.module("../../prisma/db", () => ({
	prisma: mockPrisma,
}));

describe("Check Route", async () => {
	const { app } = await import("../../index");
	it("GET /check returns exists:true for existing client", async () => {
		const response = await app.handle(
			new Request("http://localhost/check?id=ExistingClient", {
				headers: { Authorization: "Master:Secret" },
			}),
		);
		expect(response.status).toBe(200);
		const json = await response.json();
		expect(json.exists).toBe(true);
		expect(json.token).toBe("ExistingToken");
		expect(json).toMatchSnapshot();
	});

	it("GET /check returns exists:false for unknown client", async () => {
		const response = await app.handle(
			new Request("http://localhost/check?id=UnknownClient", {
				headers: { Authorization: "Master:Secret" },
			}),
		);
		expect(response.status).toBe(200);
		const json = await response.json();
		expect(json.exists).toBe(false);
		expect(json).toMatchSnapshot();
	});
});
