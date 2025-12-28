import { beforeEach, describe, expect, it } from "bun:test";
import { encrypt } from "../../src/utils/crypto";
import { mockPrisma } from "../mocks/prisma";

const encryptedToken = encrypt("secret123");

describe("verifyClientAuth", async () => {
	const { verifyClientAuth } = await import("../../src/utils/auth");

	beforeEach(() => {
		mockPrisma.client.findUnique.mockImplementation((args) => {
			if (args?.where?.ClientID === "validClient") {
				return Promise.resolve({ ClientID: "validClient", ClientToken: encryptedToken });
			}
			return Promise.resolve(null);
		});
	});

	it("returns error when authorization is null", async () => {
		const result = await verifyClientAuth(null);
		expect(result.valid).toBe(false);
		expect(result.error).toBe("Authorization header missing");
	});

	it("returns error when authorization is empty string", async () => {
		const result = await verifyClientAuth("");
		expect(result.valid).toBe(false);
		expect(result.error).toBe("Authorization header missing");
	});

	it("returns error when authorization format is invalid (no colon)", async () => {
		const result = await verifyClientAuth("invalidformat");
		expect(result.valid).toBe(false);
		expect(result.error).toBe("Invalid authorization format. Expected 'id:token'");
	});

	it("returns error when clientId is empty", async () => {
		const result = await verifyClientAuth(":token");
		expect(result.valid).toBe(false);
		expect(result.error).toBe("Invalid credentials format");
	});

	it("returns error when token is empty", async () => {
		const result = await verifyClientAuth("clientId:");
		expect(result.valid).toBe(false);
		expect(result.error).toBe("Invalid credentials format");
	});

	it("returns error when client does not exist", async () => {
		const result = await verifyClientAuth("unknownClient:sometoken");
		expect(result.valid).toBe(false);
		expect(result.error).toBe("Invalid credentials");
	});

	it("returns error when token is incorrect", async () => {
		const result = await verifyClientAuth("validClient:wrongtoken");
		expect(result.valid).toBe(false);
		expect(result.error).toBe("Invalid credentials");
	});

	it("returns valid when credentials are correct", async () => {
		const result = await verifyClientAuth("validClient:secret123");
		expect(result.valid).toBe(true);
		expect(result.clientId).toBe("validClient");
		expect(result.error).toBeUndefined();
	});

	it("returns error when token decryption fails", async () => {
		mockPrisma.client.findUnique.mockImplementation((args: unknown) => {
			const typedArgs = args as { where?: { ClientID?: string } } | undefined;
			if (typedArgs?.where?.ClientID === "corruptedClient") {
				return Promise.resolve({
					ClientID: "corruptedClient",
					ClientToken: "invalid-encrypted-data",
				});
			}
			return Promise.resolve(null);
		});

		const result = await verifyClientAuth("corruptedClient:anytoken");
		expect(result.valid).toBe(false);
		expect(result.error).toBe("Invalid credentials");
	});
});
