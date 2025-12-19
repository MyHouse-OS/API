import { Elysia, t } from "elysia";
import { HomeStateService } from "../../services/homeState";

export const tempRoutes = new Elysia()
	.get(
		"/",
		async ({ set }) => {
			try {
				const state = await HomeStateService.get();
				return {
					temp: state.temperature,
					status: "OK",
				};
			} catch (error) {
				console.error("Failed to fetch temperature:", error);
				set.status = 500;
				return {
					error: "Internal Server Error",
					status: "SERVER_ERROR",
				};
			}
		},
		{
			detail: {
				summary: "Get Temperature",
				description: "Retrieves the current recorded home temperature from the database.",
				tags: ["Temperature"],
			},
			headers: t.Object({
				authorization: t.String({
					description: "Client Credentials. Format: 'id:token'.",
					example: "LivingRoomESP:a1b2c3d4e5f6",
				}),
			}),
			response: {
				200: t.Object({
					temp: t.String({ example: "23.5", description: "Current temperature in Celsius." }),
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
		async ({ body, set }) => {
			try {
				const newState = await HomeStateService.updateTemperature(body.temp);
				return {
					message: "Temperature updated",
					temp: newState.temperature,
					status: "OK",
				};
			} catch (error) {
				console.error("Temperature update failed:", error);
				set.status = 500;
				return {
					error: "Failed to update temperature",
					status: "SERVER_ERROR",
				};
			}
		},
		{
			detail: {
				summary: "Set Temperature",
				description:
					"Updates the home temperature value in the database and broadcasts the change via WebSocket.",
				tags: ["Temperature"],
			},
			headers: t.Object({
				authorization: t.String({
					description: "Client Credentials. Format: 'id:token'.",
					example: "LivingRoomESP:a1b2c3d4e5f6",
				}),
			}),
			body: t.Object({
				temp: t.String({
					description: "New temperature value in Celsius.",
					example: "24.5",
				}),
			}),
			response: {
				200: t.Object({
					message: t.String({ example: "Temperature updated.", description: "Success message." }),
					temp: t.String({ example: "24.5", description: "The newly set temperature." }),
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
