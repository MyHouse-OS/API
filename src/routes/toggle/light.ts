import { Elysia, t } from "elysia";
import { HomeStateService } from "../../services/homeState";

export const lightRoutes = new Elysia()
	.get(
		"/",
		async ({ set }) => {
			try {
				const state = await HomeStateService.get();
				return {
					light: state.light,
					status: "OK",
				};
			} catch (error) {
				console.error("Failed to fetch light status:", error);
				set.status = 500;
				return {
					error: "Internal Server Error",
					status: "SERVER_ERROR",
				};
			}
		},
		{
			detail: {
				summary: "Get Light Status",
				description: "Returns the current state of the home light (on/off).",
				tags: ["Toggle"],
			},
			headers: t.Object({
				authorization: t.String({
					description: "Client Credentials. Format: 'id:token'.",
					example: "LivingRoomESP:a1b2c3d4e5f6",
				}),
			}),
			response: {
				200: t.Object({
					light: t.Boolean({ example: true, description: "True if light is ON." }),
					status: t.String({ example: "OK", description: "Response status." }),
				}),
				401: t.Object({
					error: t.String({ description: "Error description.", example: "Invalid credentials." }),
					status: t.String({ description: "Error status code.", example: "UNAUTHORIZED" }),
				}),
				500: t.Object({
					error: t.String({ description: "Error description.", example: "Internal Server Error." }),
					status: t.String({ description: "Error status code.", example: "SERVER_ERROR" }),
				}),
			},
		},
	)
	.post(
		"/",
		async ({ set }) => {
			try {
				const newState = await HomeStateService.toggleLight();
				return {
					message: "Light toggled",
					light: newState.light,
					status: "OK",
				};
			} catch (error) {
				console.error("Failed to toggle light:", error);
				set.status = 500;
				return {
					error: "Internal Server Error",
					status: "SERVER_ERROR",
				};
			}
		},
		{
			detail: {
				summary: "Toggle Light",
				description: "Switches the light state (ON -> OFF or OFF -> ON) and logs the event.",
				tags: ["Toggle"],
			},
			headers: t.Object({
				authorization: t.String({
					description: "Client Credentials. Format: 'id:token'.",
					example: "LivingRoomESP:a1b2c3d4e5f6",
				}),
			}),
			response: {
				200: t.Object({
					message: t.String({ example: "Light toggled.", description: "Success message." }),
					light: t.Boolean({ example: false, description: "New state after toggle." }),
					status: t.String({ example: "OK", description: "Response status." }),
				}),
				401: t.Object({
					error: t.String({ description: "Error description.", example: "Invalid credentials." }),
					status: t.String({ description: "Error status code.", example: "UNAUTHORIZED" }),
				}),
				500: t.Object({
					error: t.String({ description: "Error description.", example: "Internal Server Error." }),
					status: t.String({ description: "Error status code.", example: "SERVER_ERROR" }),
				}),
			},
		},
	);
