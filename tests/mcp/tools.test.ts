import { afterAll, beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";
import { setAuthorization, tools } from "../../src/mcp/tools";
import "../mocks/prisma";

const originalFetch = globalThis.fetch;
let mockFetchImplementation: (url: string, options?: RequestInit) => Promise<Response>;

beforeAll(() => {
	globalThis.fetch = mock((url: string | URL | Request, options?: RequestInit) => {
		return mockFetchImplementation(url.toString(), options);
	}) as typeof fetch;
});

afterAll(() => {
	globalThis.fetch = originalFetch;
});

describe("MCP Tools", () => {
	beforeEach(() => {
		setAuthorization("test:token");
	});

	describe("toggle_light", () => {
		it("toggles light successfully", async () => {
			mockFetchImplementation = async () =>
				new Response(JSON.stringify({ light: true }), { status: 200 });

			const result = await tools.toggle_light.handler({});
			expect(result.success).toBe(true);
			expect(result.light).toBe(true);
			expect(result.message).toBe("Light is now ON");
		});

		it("handles light off state", async () => {
			mockFetchImplementation = async () =>
				new Response(JSON.stringify({ light: false }), { status: 200 });

			const result = await tools.toggle_light.handler({});
			expect(result.success).toBe(true);
			expect(result.light).toBe(false);
			expect(result.message).toBe("Light is now OFF");
		});

		it("throws error on API failure", async () => {
			mockFetchImplementation = async () =>
				new Response(JSON.stringify({ error: "Server error" }), { status: 500 });

			await expect(tools.toggle_light.handler({})).rejects.toThrow("Server error");
		});
	});

	describe("toggle_door", () => {
		it("opens door successfully", async () => {
			mockFetchImplementation = async () =>
				new Response(JSON.stringify({ door: true }), { status: 200 });

			const result = await tools.toggle_door.handler({});
			expect(result.success).toBe(true);
			expect(result.door).toBe(true);
			expect(result.message).toBe("Door is now OPEN");
		});

		it("closes door successfully", async () => {
			mockFetchImplementation = async () =>
				new Response(JSON.stringify({ door: false }), { status: 200 });

			const result = await tools.toggle_door.handler({});
			expect(result.success).toBe(true);
			expect(result.door).toBe(false);
			expect(result.message).toBe("Door is now CLOSED");
		});

		it("throws error on API failure", async () => {
			mockFetchImplementation = async () =>
				new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

			await expect(tools.toggle_door.handler({})).rejects.toThrow("Unauthorized");
		});
	});

	describe("toggle_heat", () => {
		it("turns heat on successfully", async () => {
			mockFetchImplementation = async () =>
				new Response(JSON.stringify({ heat: true }), { status: 200 });

			const result = await tools.toggle_heat.handler({});
			expect(result.success).toBe(true);
			expect(result.heat).toBe(true);
			expect(result.message).toBe("Heating is now ON");
		});

		it("turns heat off successfully", async () => {
			mockFetchImplementation = async () =>
				new Response(JSON.stringify({ heat: false }), { status: 200 });

			const result = await tools.toggle_heat.handler({});
			expect(result.success).toBe(true);
			expect(result.heat).toBe(false);
			expect(result.message).toBe("Heating is now OFF");
		});
	});

	describe("set_temperature", () => {
		it("sets temperature successfully", async () => {
			mockFetchImplementation = async () =>
				new Response(JSON.stringify({ temp: "23.5" }), { status: 200 });

			const result = await tools.set_temperature.handler({ temp: "23.5" });
			expect(result.success).toBe(true);
			expect(result.temperature).toBe("23.5");
			expect(result.message).toBe("Temperature set to 23.5");
		});

		it("throws error on API failure", async () => {
			mockFetchImplementation = async () =>
				new Response(JSON.stringify({ error: "Invalid temperature" }), { status: 400 });

			await expect(tools.set_temperature.handler({ temp: "invalid" })).rejects.toThrow(
				"Invalid temperature",
			);
		});
	});

	describe("get_home_state", () => {
		it("returns complete home state", async () => {
			mockFetchImplementation = async (url: string) => {
				if (url.includes("/toggle/light")) {
					return new Response(JSON.stringify({ light: true }), { status: 200 });
				}
				if (url.includes("/toggle/door")) {
					return new Response(JSON.stringify({ door: false }), { status: 200 });
				}
				if (url.includes("/toggle/heat")) {
					return new Response(JSON.stringify({ heat: true }), { status: 200 });
				}
				if (url.includes("/temp")) {
					return new Response(JSON.stringify({ temp: "22.0" }), { status: 200 });
				}
				return new Response("Not found", { status: 404 });
			};

			const result = await tools.get_home_state.handler({});
			expect(result.light).toBe(true);
			expect(result.door).toBe(false);
			expect(result.heat).toBe(true);
			expect(result.temperature).toBe("22.0");
		});
	});

	describe("get_history", () => {
		it("returns history with default limit", async () => {
			const mockHistory = [
				{ type: "light", value: "true", createdAt: "2024-01-01T00:00:00Z" },
				{ type: "door", value: "false", createdAt: "2024-01-01T00:01:00Z" },
			];

			mockFetchImplementation = async (url: string) => {
				expect(url).toContain("limit=50");
				return new Response(JSON.stringify({ data: mockHistory, count: 2 }), { status: 200 });
			};

			const result = await tools.get_history.handler({});
			expect(result.count).toBe(2);
			expect(result.events).toHaveLength(2);
			expect(result.events[0].type).toBe("light");
		});

		it("respects custom limit", async () => {
			mockFetchImplementation = async (url: string) => {
				expect(url).toContain("limit=10");
				return new Response(JSON.stringify({ data: [], count: 0 }), { status: 200 });
			};

			const result = await tools.get_history.handler({ limit: 10 });
			expect(result.count).toBe(0);
			expect(result.events).toHaveLength(0);
		});

		it("throws error on API failure", async () => {
			mockFetchImplementation = async () =>
				new Response(JSON.stringify({ error: "Database error" }), { status: 500 });

			await expect(tools.get_history.handler({})).rejects.toThrow("Database error");
		});
	});

	describe("setAuthorization", () => {
		it("sets authorization header for API calls", async () => {
			let capturedHeaders: Headers | undefined;

			mockFetchImplementation = async (_url: string, options?: RequestInit) => {
				capturedHeaders = new Headers(options?.headers);
				return new Response(JSON.stringify({ light: true }), { status: 200 });
			};

			setAuthorization("myClient:myToken");
			await tools.toggle_light.handler({});

			expect(capturedHeaders?.get("Authorization")).toBe("myClient:myToken");
		});
	});
});
