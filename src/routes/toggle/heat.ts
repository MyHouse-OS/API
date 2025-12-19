import { Elysia, t } from "elysia";
import { HomeStateService } from "../../services/homeState";

export const heatRoutes = new Elysia()
	.get(
		"/",
		async () => {
			const state = await HomeStateService.get();
			return {
				heat: state.heat,
				status: "OK",
			};
		},
		{
			detail: {
				summary: "Get Heat Status",
				description: "Returns whether the heating system is currently active.",
				tags: ["Toggle"],
			},
			headers: t.Object({
				authorization: t.String({ description: "Client Credentials", example: "id:token" }),
			}),
			response: {
				200: t.Object({
					heat: t.Boolean({ example: true, description: "True if heating is ON" }),
					status: t.String({ example: "OK" }),
				}),
				401: t.Object({ error: t.String(), status: t.String() }),
			},
		},
	)
	.post(
		"/",
		async () => {
			const newState = await HomeStateService.toggleHeat();
			return {
				message: "Heat toggled",
				heat: newState.heat,
				status: "OK",
			};
		},
		{
			detail: {
				summary: "Toggle Heat",
				description: "Switches the heating system state (ON -> OFF or OFF -> ON).",
				tags: ["Toggle"],
			},
			headers: t.Object({
				authorization: t.String({ description: "Client Credentials", example: "id:token" }),
			}),
			response: {
				200: t.Object({
					message: t.String({ example: "Heat toggled" }),
					heat: t.Boolean({ example: false, description: "New state after toggle" }),
					status: t.String({ example: "OK" }),
				}),
				401: t.Object({ error: t.String(), status: t.String() }),
			},
		},
	);
