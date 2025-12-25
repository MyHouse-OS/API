import { beforeEach, describe, expect, it } from "bun:test";
import { Elysia } from "elysia";
import { encrypt } from "../../src/utils/crypto";
import { mockPrisma } from "../mocks/prisma";

const encryptedToken = encrypt("ValidToken");
const encryptedInvalidToken = encrypt("WrongToken");

describe("Auth Middleware", async () => {
	const { authMiddleware } = await import("../../src/middleware/auth");

	beforeEach(() => {
		mockPrisma.client.findUnique.mockImplementation((args) => {
			const clientId = args?.where?.ClientID;
			if (clientId === "ValidClient") {
				return Promise.resolve({
					ClientID: "ValidClient",
					ClientToken: encryptedToken,
				});
			}
			if (clientId === "ClientWithCorruptedToken") {
				return Promise.resolve({
					ClientID: "ClientWithCorruptedToken",
					ClientToken: "corrupted:data:not:encrypted",
				});
			}
			if (clientId === "ClientWithWrongToken") {
				return Promise.resolve({
					ClientID: "ClientWithWrongToken",
					ClientToken: encryptedInvalidToken,
				});
			}
			return Promise.resolve(null);
		});
	});

	const createTestApp = () => {
		return new Elysia()
			.use(authMiddleware)
			.get("/test", ({ user }) => ({ success: true, client: user.ClientID }));
	};

	it("valid credentials return user object", async () => {
		const app = createTestApp();
		const response = await app.handle(
			new Request("http://localhost/test", {
				headers: { Authorization: "ValidClient:ValidToken" },
			}),
		);

		expect(response.status).toBe(200);
		const json = await response.json();
		expect(json.success).toBe(true);
		expect(json.client).toBe("ValidClient");
	});

	it("missing authorization header returns 401", async () => {
		const app = createTestApp();
		const response = await app.handle(new Request("http://localhost/test"));

		expect(response.status).toBe(401);
		expect(await response.text()).toBe("Authorization header missing");
	});

	it("authorization header without colon returns 401", async () => {
		const app = createTestApp();
		const response = await app.handle(
			new Request("http://localhost/test", {
				headers: { Authorization: "InvalidFormatNoColon" },
			}),
		);

		expect(response.status).toBe(401);
		expect(await response.text()).toBe("Invalid authorization format. Expected 'id:token'");
	});

	it("empty clientId returns 401", async () => {
		const app = createTestApp();
		const response = await app.handle(
			new Request("http://localhost/test", {
				headers: { Authorization: ":SomeToken" },
			}),
		);

		expect(response.status).toBe(401);
		expect(await response.text()).toBe("Invalid credentials format");
	});

	it("empty token returns 401", async () => {
		const app = createTestApp();
		const response = await app.handle(
			new Request("http://localhost/test", {
				headers: { Authorization: "SomeClient:" },
			}),
		);

		expect(response.status).toBe(401);
		expect(await response.text()).toBe("Invalid credentials format");
	});

	it("non-existent client returns 401", async () => {
		const app = createTestApp();
		const response = await app.handle(
			new Request("http://localhost/test", {
				headers: { Authorization: "UnknownClient:SomeToken" },
			}),
		);

		expect(response.status).toBe(401);
		expect(await response.text()).toBe("Invalid credentials");
	});

	it("invalid token (doesn't match) returns 401", async () => {
		const app = createTestApp();
		const response = await app.handle(
			new Request("http://localhost/test", {
				headers: { Authorization: "ClientWithWrongToken:ValidToken" },
			}),
		);

		expect(response.status).toBe(401);
		expect(await response.text()).toBe("Invalid credentials");
	});

	it("token decryption error returns 401", async () => {
		const app = createTestApp();
		const response = await app.handle(
			new Request("http://localhost/test", {
				headers: { Authorization: "ClientWithCorruptedToken:SomeToken" },
			}),
		);

		expect(response.status).toBe(401);
		expect(await response.text()).toBe("Invalid credentials");
	});
});
