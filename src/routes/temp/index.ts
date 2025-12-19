import { Elysia, t } from "elysia";
import { HomeStateService } from "../../services/homeState";

export const tempRoutes = new Elysia()
	.get(
		"/",
		async () => {
			const state = await HomeStateService.get();
			return {
				temp: state.temperature,
				status: "OK",
			};
		},
		{
			detail: {
				summary: "Get Temperature",
				description: "Retrieves the current recorded home temperature.",
				tags: ["Temperature"],
			},
			headers: t.Object({
				authorization: t.String({ description: "Client Credentials", example: "id:token" }),
			}),
			response: {
				200: t.Object({
					temp: t.String({ example: "23.5", description: "Current temperature in Celsius" }),
					status: t.String({ example: "OK", description: "Response status" }),
				}),
				401: t.Object({
					error: t.String({
						example: "Invalid credentials",
						description: "Error message indicating authentication failure",
					}),
					status: t.String({ example: "UNAUTHORIZED", description: "Authentication status" }),
				}),
			},
		},
	)
	.post(
		"/",
		async ({ body }) => {
			const newState = await HomeStateService.updateTemperature(body.temp);
			return {
				message: "Temperature updated",
				temp: newState.temperature,
				status: "OK",
			};
		},
		{
			detail: {
				summary: "Set Temperature",
				description: "Updates the home temperature value in the database.",
				tags: ["Temperature"],
			},
			headers: t.Object({
				authorization: t.String({ description: "Client Credentials", example: "id:token" }),
			}),
			body: t.Object({
				temp: t.String({
					description: "New temperature value",
					example: "24.5",
				}),
			}),
			response: {
				200: t.Object({
					message: t.String({ example: "Temperature updated" }),
					temp: t.String({ example: "24.5" }),
					status: t.String({ example: "OK" }),
				}),
				401: t.Object({ error: t.String(), status: t.String() }),
			},
		},
	);
