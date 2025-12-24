import { describe, expect, it, mock } from "bun:test";
import { encrypt } from "../../src/utils/crypto";

const encryptedMasterToken = encrypt("Secret");

const mockPrisma = {
	client: {
		findUnique: mock((args) => {
			if (args?.where?.ClientID === "Master") {
				return Promise.resolve({ ClientID: "Master", ClientToken: encryptedMasterToken });
			}
			return Promise.resolve(null);
		}),
		upsert: mock((args) =>
			Promise.resolve({ ClientID: args.create.ClientID, ClientToken: args.create.ClientToken }),
		),
	},
};

mock.module("../../prisma/db", () => ({
	prisma: mockPrisma,
}));

describe("Auth Route", async () => {
	const { app } = await import("../../index");
	it("POST /auth requires master authentication", async () => {
		const response = await app.handle(
			new Request("http://localhost/auth", {
				method: "POST",
				body: JSON.stringify({ id: "NewClient", token: "NewToken" }),
				headers: { "Content-Type": "application/json" },
			}),
		);
		expect(response.status).toBe(401);
		expect(await response.text()).toBe("Authorization header missing");
	});

	it("POST /auth registers new client", async () => {
		const response = await app.handle(
			new Request("http://localhost/auth", {
				method: "POST",
				body: JSON.stringify({ id: "NewClient", token: "NewToken" }),
				headers: {
					"Content-Type": "application/json",
					Authorization: "Master:Secret",
				},
			}),
		);
		expect(response.status).toBe(200);
		const json = await response.json();
		expect(json.status).toBe("OK");
		expect(json.client).toBe("NewClient");
		expect(json).toMatchSnapshot();
	});
});
