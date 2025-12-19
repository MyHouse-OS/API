import { Elysia, t } from "elysia";
import { prisma } from "../../../prisma/db";

export const historyRoutes = new Elysia().get(
	"/",
	async ({ query, set }) => {
		const limit = query.limit ? Number(query.limit) : 50;

		try {
			const history = await prisma.history.findMany({
				take: limit,
				orderBy: {
					createdAt: "desc",
				},
			});

			return {
				data: history,
				count: history.length,
				status: "OK",
			};
		} catch (error) {
			console.error("Failed to fetch history:", error);
			set.status = 500;
			return {
				error: "Internal Server Error",
				status: "SERVER_ERROR",
			};
		}
	},
	{
		detail: {
			summary: "Get Event History",
			description:
				"Retrieves a list of recent events (Temperature changes, Toggles, etc.) logged by the system. Useful for auditing and graphing.",
			tags: ["History"],
		},
		headers: t.Object({
			authorization: t.String({
				description: "Client Credentials. Format: 'id:token'",
				example: "MasterServer:SecretKey123",
			}),
		}),
		query: t.Object({
			limit: t.Optional(
				t.String({
					description: "Number of records to retrieve (default: 50)",
					example: "20",
				}),
			),
		}),
		response: {
			200: t.Object({
				data: t.Array(
					t.Object({
						id: t.Number({ description: "Unique event identifier" }),
						type: t.String({
							example: "TEMPERATURE",
							description: "Type of the event (TEMPERATURE, LIGHT, DOOR, HEAT)",
						}),
						value: t.String({ example: "24.5", description: "Value associated with the event" }),
						createdAt: t.Date({ description: "Timestamp of when the event occurred" }),
					}),
				),
				count: t.Number({ description: "Total number of records returned" }),
				status: t.String({ example: "OK" }),
			}),
			401: t.Object({
				error: t.String({ description: "Error description", example: "Invalid credentials" }),
				status: t.String({ description: "Error status code", example: "UNAUTHORIZED" }),
			}),
			500: t.Object({
				error: t.String({ description: "Error description", example: "Failed to fetch history" }),
				status: t.String({ description: "Error status code", example: "SERVER_ERROR" }),
			}),
		},
	},
);
