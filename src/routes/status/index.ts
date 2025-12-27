import { Elysia, t } from "elysia";
import { prisma } from "../../../prisma/db";

export const statusRoutes = new Elysia().get(
	"/",
	async ({ set }) => {
		try {
			await prisma.$queryRaw`SELECT 1`;
			return {
				status: "OK",
				database: "Connected",
				uptime: process.uptime(),
			};
		} catch (error) {
			set.status = 500;
			return {
				status: "ERROR",
				database: "Disconnected",
				error: String(error),
			};
		}
	},
	{
		detail: {
			summary: "System Health Check",
			description:
				"Returns the current operational status of the API and the database connection. Used for monitoring and uptime checks.",
			tags: ["System"],
		},
		response: {
			200: t.Object({
				status: t.String({ example: "OK", description: "Global API status." }),
				database: t.String({ example: "Connected", description: "Database connection status." }),
				uptime: t.Number({ example: 3600, description: "Server uptime in seconds." }),
			}),
			500: t.Object({
				status: t.String({ example: "ERROR", description: "Global API status." }),
				database: t.String({ example: "Disconnected", description: "Database connection status." }),
				error: t.String({
					example: "Database connection failed.",
					description: "Detailed error message.",
				}),
			}),
		},
	},
);
