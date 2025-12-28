import { afterAll, beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";
import { encrypt } from "../../src/utils/crypto";
import { mockPrisma } from "../mocks/prisma";

const encryptedToken = encrypt("secret123");

describe("MCP Server", () => {
	let mockBunServe: ReturnType<typeof mock>;
	let capturedFetchHandler: (req: Request) => Promise<Response>;
	const originalBunServe = Bun.serve;
	const originalConsoleLog = console.log;

	beforeAll(() => {
		console.log = mock(() => {});
		mockBunServe = mock((config: { port: number; fetch: (req: Request) => Promise<Response> }) => {
			capturedFetchHandler = config.fetch;
			return { port: config.port };
		});
		(Bun as { serve: typeof Bun.serve }).serve = mockBunServe as typeof Bun.serve;
	});

	afterAll(() => {
		(Bun as { serve: typeof Bun.serve }).serve = originalBunServe;
		console.log = originalConsoleLog;
	});

	beforeEach(() => {
		mockPrisma.client.findUnique.mockImplementation((args: unknown) => {
			const typedArgs = args as { where?: { ClientID?: string } } | undefined;
			if (typedArgs?.where?.ClientID === "validClient") {
				return Promise.resolve({ ClientID: "validClient", ClientToken: encryptedToken });
			}
			return Promise.resolve(null);
		});
	});

	describe("startMcpServer", () => {
		it("starts server on default port 3001", async () => {
			const { startMcpServer } = await import("../../src/mcp/server");
			await startMcpServer();

			expect(mockBunServe).toHaveBeenCalled();
			const callArgs = mockBunServe.mock.calls[0] as [{ port: number }];
			expect(callArgs[0].port).toBe(3001);
		});
	});

	describe("HTTP handler", () => {
		beforeEach(async () => {
			mockBunServe.mockClear();
			const { startMcpServer } = await import("../../src/mcp/server");
			await startMcpServer();
		});

		describe("OPTIONS requests (CORS preflight)", () => {
			it("returns 204 with CORS headers", async () => {
				const request = new Request("http://localhost:3001/mcp", {
					method: "OPTIONS",
				});

				const response = await capturedFetchHandler(request);

				expect(response.status).toBe(204);
				expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
				expect(response.headers.get("Access-Control-Allow-Methods")).toContain("POST");
				expect(response.headers.get("Access-Control-Allow-Headers")).toContain("Authorization");
			});
		});

		describe("GET /health", () => {
			it("returns health status", async () => {
				const request = new Request("http://localhost:3001/health", {
					method: "GET",
				});

				const response = await capturedFetchHandler(request);
				const body = (await response.json()) as { status: string; server: string };

				expect(response.status).toBe(200);
				expect(body.status).toBe("ok");
				expect(body.server).toBe("myhouse-os-mcp");
			});

			it("includes CORS headers", async () => {
				const request = new Request("http://localhost:3001/health", {
					method: "GET",
				});

				const response = await capturedFetchHandler(request);

				expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
			});
		});

		describe("POST /mcp", () => {
			it("returns 401 when authorization is missing", async () => {
				const request = new Request("http://localhost:3001/mcp", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({}),
				});

				const response = await capturedFetchHandler(request);
				const body = (await response.json()) as { error: string };

				expect(response.status).toBe(401);
				expect(body.error).toBe("Authorization header missing");
			});

			it("returns 401 when authorization format is invalid", async () => {
				const request = new Request("http://localhost:3001/mcp", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "invalidformat",
					},
					body: JSON.stringify({}),
				});

				const response = await capturedFetchHandler(request);
				const body = (await response.json()) as { error: string };

				expect(response.status).toBe(401);
				expect(body.error).toBe("Invalid authorization format. Expected 'id:token'");
			});

			it("returns 401 when client does not exist", async () => {
				const request = new Request("http://localhost:3001/mcp", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "unknownClient:token",
					},
					body: JSON.stringify({}),
				});

				const response = await capturedFetchHandler(request);
				const body = (await response.json()) as { error: string };

				expect(response.status).toBe(401);
				expect(body.error).toBe("Invalid credentials");
			});

			it("returns 401 when token is wrong", async () => {
				const request = new Request("http://localhost:3001/mcp", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "validClient:wrongtoken",
					},
					body: JSON.stringify({}),
				});

				const response = await capturedFetchHandler(request);
				const body = (await response.json()) as { error: string };

				expect(response.status).toBe(401);
				expect(body.error).toBe("Invalid credentials");
			});

			it("handles valid MCP request with correct credentials", async () => {
				const request = new Request("http://localhost:3001/mcp", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "validClient:secret123",
					},
					body: JSON.stringify({ jsonrpc: "2.0", method: "tools/list", id: 1 }),
				});

				const response = await capturedFetchHandler(request);

				// Response should not be 401 if auth is valid
				expect(response.status).not.toBe(401);
				// CORS headers should be present
				expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
			});

			it("includes CORS headers on 401 response", async () => {
				const request = new Request("http://localhost:3001/mcp", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({}),
				});

				const response = await capturedFetchHandler(request);

				expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
			});
		});

		describe("Unknown routes", () => {
			it("returns 404 for unknown paths", async () => {
				const request = new Request("http://localhost:3001/unknown", {
					method: "GET",
				});

				const response = await capturedFetchHandler(request);

				expect(response.status).toBe(404);
			});

			it("returns 404 for unknown POST paths", async () => {
				const request = new Request("http://localhost:3001/api/unknown", {
					method: "POST",
					body: JSON.stringify({}),
				});

				const response = await capturedFetchHandler(request);

				expect(response.status).toBe(404);
			});

			it("includes CORS headers on 404", async () => {
				const request = new Request("http://localhost:3001/unknown", {
					method: "GET",
				});

				const response = await capturedFetchHandler(request);

				expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
			});
		});
	});

	describe("CORS headers", () => {
		beforeEach(async () => {
			mockBunServe.mockClear();
			const { startMcpServer } = await import("../../src/mcp/server");
			await startMcpServer();
		});

		it("exposes mcp-session-id header", async () => {
			const request = new Request("http://localhost:3001/mcp", {
				method: "OPTIONS",
			});

			const response = await capturedFetchHandler(request);

			expect(response.headers.get("Access-Control-Expose-Headers")).toContain("mcp-session-id");
		});

		it("exposes mcp-protocol-version header", async () => {
			const request = new Request("http://localhost:3001/mcp", {
				method: "OPTIONS",
			});

			const response = await capturedFetchHandler(request);

			expect(response.headers.get("Access-Control-Expose-Headers")).toContain(
				"mcp-protocol-version",
			);
		});

		it("allows mcp-session-id in requests", async () => {
			const request = new Request("http://localhost:3001/mcp", {
				method: "OPTIONS",
			});

			const response = await capturedFetchHandler(request);

			expect(response.headers.get("Access-Control-Allow-Headers")).toContain("mcp-session-id");
		});

		it("allows DELETE method", async () => {
			const request = new Request("http://localhost:3001/mcp", {
				method: "OPTIONS",
			});

			const response = await capturedFetchHandler(request);

			expect(response.headers.get("Access-Control-Allow-Methods")).toContain("DELETE");
		});
	});
});

describe("wrapToolHandler", () => {
	it("wraps successful tool result in MCP format", async () => {
		const { wrapToolHandler } = await import("../../src/mcp/server");
		const successHandler = async () => ({ success: true, data: "test" });

		const result = await wrapToolHandler(successHandler, {});

		expect(result.content).toBeDefined();
		expect(result.content.length).toBeGreaterThan(0);
		expect(result.content[0].type).toBe("text");
		expect(result.content[0].text).toContain("success");
		expect(result.content[0].text).toContain("true");
		expect(result.isError).toBeUndefined();
	});

	it("wraps Error in MCP error format", async () => {
		const { wrapToolHandler } = await import("../../src/mcp/server");
		const errorHandler = async () => {
			throw new Error("Test error message");
		};

		const result = await wrapToolHandler(errorHandler, {});

		expect(result.content).toBeDefined();
		expect(result.content.length).toBeGreaterThan(0);
		expect(result.content[0].type).toBe("text");
		expect(result.content[0].text).toContain("Test error message");
		expect(result.isError).toBe(true);
	});

	it("handles non-Error thrown values", async () => {
		const { wrapToolHandler } = await import("../../src/mcp/server");
		const errorHandler = async () => {
			throw "string error";
		};

		const result = await wrapToolHandler(errorHandler, {});

		expect(result.content[0].text).toContain("Unknown error");
		expect(result.isError).toBe(true);
	});

	it("formats result as JSON with indentation", async () => {
		const { wrapToolHandler } = await import("../../src/mcp/server");
		const handler = async () => ({ nested: { value: 123 } });

		const result = await wrapToolHandler(handler, {});

		expect(result.content[0].text).toContain("\n");
		expect(result.content[0].text).toContain("  ");
	});

	it("passes args to the handler", async () => {
		const { wrapToolHandler } = await import("../../src/mcp/server");
		let receivedArgs: Record<string, unknown> = {};
		const handler = async (args: Record<string, unknown>) => {
			receivedArgs = args;
			return { received: true };
		};

		await wrapToolHandler(handler, { temp: "23.5" });

		expect(receivedArgs).toEqual({ temp: "23.5" });
	});
});
