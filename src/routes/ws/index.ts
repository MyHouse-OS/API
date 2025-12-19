import { Elysia } from "elysia";
import { HomeStateService } from "../../services/homeState";
import { EVENTS, eventBus } from "../../utils/eventBus";

export const wsRoutes = new Elysia().ws("/ws", {
	open: async (ws) => {
		console.log("WebSocket connected");
		ws.subscribe("home-updates");

		const state = await HomeStateService.get();
		ws.send({
			type: "INIT",
			data: state,
		});

		eventBus.emit(EVENTS.NEW_CONNECTION);
	},
	message: () => {},
	close: (ws) => {
		console.log("WebSocket disconnected");
		ws.unsubscribe("home-updates");
	},
});
