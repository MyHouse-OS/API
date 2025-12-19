import { Elysia, t } from "elysia";
import { HomeStateService } from "../../services/homeState";

export const doorRoutes = new Elysia()
	.get(
		"/",
		async () => {
			const state = await HomeStateService.get();
			return {
				door: state.door,
				status: "OK",
			};
		},
		{
			detail: {
				summary: "Get Door Status",
				description: "Returns whether the door is currently open or closed.",
				tags: ["Toggle"],
			},
			headers: t.Object({
				authorization: t.String({ description: "Client Credentials", example: "id:token" }),
			}),
			response: {
				200: t.Object({
					door: t.Boolean({ example: false, description: "True if door is OPEN" }),
					status: t.String({ example: "OK" }),
				}),
				401: t.Object({ error: t.String(), status: t.String() }),
			},
		},
	)
	.post(
		"/",
		async () => {
			const newState = await HomeStateService.toggleDoor();
			return {
				message: "Door toggled",
				door: newState.door,
				status: "OK",
			};
		},
		{
			detail: {
				summary: "Toggle Door",
				description: "Switches the door state (OPEN -> CLOSED or CLOSED -> OPEN).",
				tags: ["Toggle"],
			},
			headers: t.Object({
				authorization: t.String({ description: "Client Credentials", example: "id:token" }),
			}),
			response: {
				200: t.Object({
					message: t.String({ example: "Door toggled" }),
					door: t.Boolean({ example: true, description: "New state after toggle" }),
					status: t.String({ example: "OK" }),
				}),
				401: t.Object({ error: t.String(), status: t.String() }),
			},
		},
	);
