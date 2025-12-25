import { beforeEach, describe, expect, it } from "bun:test";
import { encrypt } from "../../src/utils/crypto";
import { mockPrisma } from "../mocks/prisma";

const encryptedExistingToken = encrypt("ExistingToken");
const encryptedMasterToken = encrypt("Secret");

describe("Check Route", async () => {
	const { app } = await import("../../index");

	beforeEach(() => {
		mockPrisma.client.findFirst.mockImplementation(() =>
			Promise.resolve({ ClientID: "Master", ClientToken: encryptedMasterToken }),
		);
		mockPrisma.client.findUnique.mockImplementation((args) => {
			if (args.where.ClientID === "ExistingClient") {
				return Promise.resolve({ ClientID: "ExistingClient", ClientToken: encryptedExistingToken });
			}
			if (args.where.ClientID === "Master") {
				return Promise.resolve({ ClientID: "Master", ClientToken: encryptedMasterToken });
			}
			return Promise.resolve(null);
		});
	});
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
