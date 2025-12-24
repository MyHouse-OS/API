import { beforeEach, describe, expect, it, mock } from "bun:test";

const mockPrisma = {
	$queryRaw: mock(() => Promise.resolve([1])),
};

mock.module("../../prisma/db", () => ({
	prisma: mockPrisma,
}));

describe("Public Routes", async () => {
	const { app } = await import("../../index");

	beforeEach(() => {
		mockPrisma.$queryRaw = mock(() => Promise.resolve([1]));
	});

	it("GET / returns banner", async () => {
		const response = await app.handle(new Request("http://localhost/"));
		expect(response.status).toBe(200);
		expect(response).toMatchSnapshot();
	});

	it("GET /status returns OK", async () => {
		const response = await app.handle(new Request("http://localhost/status"));
		if (response.status !== 200) {
			console.log("Status Error Body:", await response.text());
		}
		expect(response.status).toBe(200);
		const json = await response.json();
		expect(json).toHaveProperty("status", "OK");
		expect(json).toMatchSnapshot({
			uptime: expect.any(Number),
		});
	});
});
