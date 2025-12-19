import { afterAll, describe, expect, it, mock } from "bun:test";
import { EVENTS, eventBus } from "../../src/utils/eventBus";

// Mock Prisma
const mockState = {
	id: 1,
	temperature: "20.5",
	light: false,
	door: true,
	heat: false,
};

const mockPrisma = {
	homeState: {
		upsert: mock(() => Promise.resolve(mockState)),
		update: mock(() => Promise.resolve(mockState)),
		findFirst: mock(() => Promise.resolve(mockState)),
	},
	history: {
		create: mock(() => Promise.resolve({})),
	},
};

mock.module("../../prisma/db", () => ({
	prisma: mockPrisma,
}));

describe("WebSocket Route", async () => {
	// Import dynamique après le mock
	const { app } = await import("../../index");

	// On démarre le serveur pour de vrai sur un port éphémère
	app.listen(0);
	const server = app.server;

	if (!server) throw new Error("Server failed to start");

	const port = server.port;
	const wsUrl = `ws://localhost:${port}/ws`;

	afterAll(() => {
		app.stop();
	});

	it("should connect and receive initial state", async () => {
		const ws = new WebSocket(wsUrl);

		try {
			const messagePromise = new Promise((resolve) => {
				ws.onmessage = (event) => {
					resolve(JSON.parse(event.data as string));
				};
			});
			const message = (await messagePromise) as { type: string; data: Record<string, unknown> };

			expect(message.type).toBe("INIT");
			expect(message.data).toEqual(mockState);
		} finally {
			ws.close();
		}
	});

	it("should receive updates from eventBus", async () => {
		const ws = new WebSocket(wsUrl);

		try {
			// On ignore le premier message (INIT)
			let _initReceived = false;

			const updatePromise = new Promise((resolve) => {
				ws.onmessage = (event) => {
					const msg = JSON.parse(event.data as string);
					if (msg.type === "INIT") {
						_initReceived = true;
					} else if (msg.type === "UPDATE") {
						resolve(msg);
					}
				};
			});

			await new Promise<void>((resolve) => {
				if (ws.readyState === WebSocket.OPEN) resolve();
				ws.onopen = () => resolve();
			});

			// Simuler un événement interne
			eventBus.emit(EVENTS.STATE_CHANGE, { type: "TEMP", value: "25.0" });

			const update = (await updatePromise) as { type: string; data: Record<string, unknown> };
			expect(update.type).toBe("UPDATE");
			expect(update.data).toEqual({ type: "TEMP", value: "25.0" });
		} finally {
			ws.close();
		}
	});
});
