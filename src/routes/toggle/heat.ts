import { Elysia, t } from "elysia";
import { HomeStateService } from "../../services/homeState";

export const heatRoutes = new Elysia()
	.get(
		"/",
		async ({ set }) => {
			try {
				const state = await HomeStateService.get();
				return {
					heat: state.heat,
					status: "OK",
				};
			} catch (error) {
				console.error("Failed to fetch heat status:", error);
				set.status = 500;
				return {
					error: "Internal Server Error",
					status: "SERVER_ERROR",
				};
			}
		},
		{
			detail: {
				summary: "Get Heat Status",
				description: "Returns whether the heating system is currently active.",
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
					heat: t.Boolean({ example: true, description: "True if heating is ON." }),
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
				const newState = await HomeStateService.toggleHeat();
				return {
					message: "Heat toggled",
					heat: newState.heat,
					status: "OK",
				};
			} catch (error) {
				console.error("Failed to toggle heat:", error);
				set.status = 500;
				return {
					error: "Internal Server Error",
					status: "SERVER_ERROR",
				};
			}
		},
		{
			detail: {
				summary: "Toggle Heat",
				description:
					"Switches the heating system state (ON -> OFF or OFF -> ON) and logs the event.",
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
					message: t.String({ example: "Heat toggled.", description: "Success message." }),
					heat: t.Boolean({ example: false, description: "New state after toggle." }),
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
