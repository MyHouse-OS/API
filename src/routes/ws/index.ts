import { Elysia } from "elysia";
import { HomeStateService } from "../../services/homeState";
import { EVENTS, eventBus } from "../../utils/eventBus";

export const wsRoutes = new Elysia().ws("/ws", {
	open: async (ws) => {
		console.log("WebSocket connected");
		ws.subscribe("home-updates");

		// Send initial state
		const state = await HomeStateService.get();
		ws.send({
			type: "INIT",
			data: state,
		});

		eventBus.emit(EVENTS.NEW_CONNECTION);
	},
	message: () => {
		// We don't expect messages from client for now, strictly push
	},
	close: (ws) => {
		console.log("WebSocket disconnected");
		ws.unsubscribe("home-updates");
	},
});

// Listener global : Quand le Service dit "Ça a bougé !", on broadcast via le serveur Bun
// Note: On a besoin de l'instance 'app' pour appeler server.publish.
// Comme on est dans un module, on ne l'a pas directement.
// Astuce : On va utiliser une fonction d'initialisation ou s'appuyer sur le fait que
// Elysia gère ça. Mais le plus simple est de le faire dans index.ts ou ici si on peut récupérer l'instance.
