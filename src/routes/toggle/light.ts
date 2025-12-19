import { Elysia, t } from "elysia";
import { HomeStateService } from "../../services/homeState";

export const lightRoutes = new Elysia()
	.get(
		"/",
		async () => {
			const state = await HomeStateService.get();
			return {
				light: state.light,
				status: "OK",
			};
		},
		{
			detail: {
				summary: "Get Light Status",
				description: "Returns the current state of the home light (on/off).",
				tags: ["Toggle"],
			},
			headers: t.Object({
				authorization: t.String({ description: "Client Credentials", example: "id:token" }),
			}),
			response: {
				200: t.Object({
					light: t.Boolean({ example: true, description: "True if light is ON" }),
					status: t.String({ example: "OK" }),
				}),
				401: t.Object({ error: t.String(), status: t.String() }),
			},
		},
	)
	.post(
		"/",
		async () => {
			const newState = await HomeStateService.toggleLight();
			return {
				message: "Light toggled",
				light: newState.light,
				status: "OK",
			};
		},
		{
			detail: {
				summary: "Toggle Light",
				description: "Switches the light state (ON -> OFF or OFF -> ON).",
				tags: ["Toggle"],
			},
			headers: t.Object({
				authorization: t.String({ description: "Client Credentials", example: "id:token" }),
			}),
			response: {
				200: t.Object({
					message: t.String({ example: "Light toggled" }),
					light: t.Boolean({ example: false, description: "New state after toggle" }),
					status: t.String({ example: "OK" }),
				}),
				401: t.Object({ error: t.String(), status: t.String() }),
			},
		},
	);
