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
		try {
			const id = ws.id;
			console.log(`[WS] New Connection Established | ID: ${id} | Remote: ${ws.remoteAddress}`);

			ws.subscribe("home-updates");
			console.log(`[WS] ✅ Client subscribed to 'home-updates' | ID: ${id}`);

			const state = await HomeStateService.get();

			const payload = JSON.stringify({
				type: "INIT",
				data: state,
			});

			ws.send(payload);
			console.log("[WS] 📤 INIT sent to client");

			eventBus.emit(EVENTS.NEW_CONNECTION);
		} catch (error) {
			console.error("[WS] ❌ Error in open handler:", error);
			ws.close();
		}
	},
	message: (message) => {
		console.log("[WS] 📩 Message received:", message);
	},
	close: (ws, code, message) => {
		console.log(`[WS] 🚪 Connection Closed | Code: ${code} | Reason: ${message}`);
		try {
			ws.unsubscribe("home-updates");
		} catch (_e) {
			console.error("[WS] ❌ Error during unsubscribe on close");
		}
	},
});
