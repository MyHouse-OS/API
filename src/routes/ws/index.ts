import { Elysia } from "elysia";
import { HomeStateService } from "../../services/homeState";
import { EVENTS, eventBus } from "../../utils/eventBus";

export const wsRoutes = new Elysia().ws("/ws", {
	detail: {
		summary: "Real-time Home State Updates",
		description:
			"WebSocket endpoint for subscribing to real-time changes in the home state (Temperature, Lights, etc.).\n\n**Protocol:**\n- **On Connect:** Server sends `{ type: 'INIT', data: HomeState }`\n- **On Update:** Server sends `{ type: 'UPDATE', data: { type: 'TEMP'|'LIGHT'|..., value: string } }`",
		tags: ["WebSocket"],
	},
	open: async (ws) => {
		const id = ws.id;
		console.log(`[WS] New Connection Established | ID: ${id} | Remote: ${ws.remoteAddress}`);

		ws.subscribe("home-updates");
		console.log(`[WS] Client ${id} subscribed to 'home-updates'`);

		const state = await HomeStateService.get();
		ws.send({
			type: "INIT",
			data: state,
		});

		eventBus.emit(EVENTS.NEW_CONNECTION);
	},
	message: (ws, message) => {
		console.log(`[WS] Received message from ${ws.id}:`, message);
	},
	close: (ws) => {
		console.log(`[WS] Connection Closed | ID: ${ws.id}`);
		ws.unsubscribe("home-updates");
	},
});
