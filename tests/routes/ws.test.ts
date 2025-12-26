import { afterAll, beforeEach, describe, expect, it } from "bun:test";
import { EVENTS, eventBus } from "../../src/utils/eventBus";
import { mockPrisma } from "../mocks/prisma";

const mockState = {
	id: 1,
	temperature: "20",
	light: false,
	door: false,
	heat: false,
};

describe("WebSocket Route", async () => {
	const { app } = await import("../../index");

	app.listen(0);
	const server = app.server;

	if (!server) throw new Error("Server failed to start");

	const port = server.port;
	const wsUrl = `ws://localhost:${port}/ws`;

	beforeEach(() => {
		Object.assign(mockState, {
			id: 1,
			temperature: "20",
			light: false,
			door: false,
			heat: false,
		});

		// Réinitialiser les mocks pour ce test
		mockPrisma.client.findUnique.mockImplementation(() => Promise.resolve(null));
		mockPrisma.client.findFirst.mockImplementation(() => Promise.resolve(null));
		mockPrisma.client.upsert.mockImplementation(() => Promise.resolve({} as never));

		mockPrisma.homeState.upsert.mockImplementation((args: never) => {
			const updateData = (args as { update?: Record<string, unknown> })?.update;
			// Ne muter mockState que si update contient réellement des données
			if (updateData && Object.keys(updateData).length > 0) {
				Object.assign(mockState, updateData);
			}
			return Promise.resolve({ ...mockState });
		});
		mockPrisma.homeState.update.mockImplementation((args: never) => {
			Object.assign(mockState, (args as { data?: Record<string, unknown> })?.data || {});
			return Promise.resolve({ ...mockState });
		});
		mockPrisma.homeState.findFirst.mockImplementation(() => Promise.resolve({ ...mockState }));
		mockPrisma.homeState.findUnique.mockImplementation(() => Promise.resolve({ ...mockState }));

		mockPrisma.history.create.mockImplementation(() => Promise.resolve({} as never));
		mockPrisma.history.findMany.mockImplementation(() => Promise.resolve([]));

		mockPrisma.$queryRaw.mockImplementation(() => Promise.resolve([1]));
	});

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

			eventBus.emit(EVENTS.STATE_CHANGE, { type: "TEMP", value: "25.0" });

			const update = (await updatePromise) as { type: string; data: Record<string, unknown> };
			expect(update.type).toBe("UPDATE");
			expect(update.data).toEqual({ type: "TEMP", value: "25.0" });
		} finally {
			ws.close();
		}
	});
});
