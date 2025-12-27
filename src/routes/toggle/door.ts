import { Elysia, t } from "elysia";
import { HomeStateService } from "../../services/homeState";

export const doorRoutes = new Elysia()
	.get(
		"/",
		async ({ set }) => {
			try {
				const state = await HomeStateService.get();
				return {
					door: state.door,
					status: "OK",
				};
			} catch (error) {
				console.error("Failed to fetch door status:", error);
				set.status = 500;
				return {
					error: "Internal Server Error",
					status: "SERVER_ERROR",
				};
			}
		},
		{
			detail: {
				summary: "Get Door Status",
				description: "Returns whether the door is currently open or closed.",
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
					door: t.Boolean({ example: false, description: "True if door is OPEN." }),
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
				const newState = await HomeStateService.toggleDoor();
				return {
					message: "Door toggled",
					door: newState.door,
					status: "OK",
				};
			} catch (error) {
				console.error("Failed to toggle door:", error);
				set.status = 500;
				return {
					error: "Internal Server Error",
					status: "SERVER_ERROR",
				};
			}
		},
		{
			detail: {
				summary: "Toggle Door",
				description:
					"Switches the door state (OPEN -> CLOSED or CLOSED -> OPEN) and logs the event.",
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
					message: t.String({ example: "Door toggled.", description: "Success message." }),
					door: t.Boolean({ example: true, description: "New state after toggle." }),
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
