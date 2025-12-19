import { Elysia, t } from "elysia";
import { prisma } from "../../../prisma/db";
import { decrypt } from "../../utils/crypto";

export const checkRoutes = new Elysia().get(
	"/",
	async ({ query, set }) => {
		const { id } = query;

		if (!id) {
			set.status = 400;
			return {
				error: "Missing id query parameter",
				status: "BAD_REQUEST",
			};
		}

		const client = await prisma.client.findUnique({
			where: { ClientID: id },
		});

		if (client) {
			try {
				const originalToken = decrypt(client.ClientToken);
				return {
					exists: true,
					token: originalToken,
				};
			} catch (error) {
				console.error("Failed to decrypt token for client:", id);
				return {
					exists: true,
					token: null,
					error: "Token corruption",
				};
			}
		}

		return {
			exists: false,
		};
	},
	{
		detail: {
			summary: "Check Client Existence",
			description:
				"Verifies if a client ID exists in the database. If found, returns its secret token. Requires authentication.",
			tags: ["Check"],
		},
		headers: t.Object({
			authorization: t.String({
				description: "Client Credentials. Format: 'id:token'",
				example: "MasterServer:SecretKey123",
			}),
		}),
		query: t.Object({
			id: t.String({
				description: "The Client ID to search for",
				example: "LivingRoomESP",
			}),
		}),
		response: {
			200: t.Object({
				exists: t.Boolean({ description: "True if the client exists" }),
				token: t.Optional(t.String({ description: "The client's secret token (only if exists)" })),
			}),
			400: t.Object(
				{
					error: t.String(),
					status: t.String(),
				},
				{ description: "Missing query parameter" },
			),
			401: t.Object(
				{
					error: t.String(),
					status: t.String(),
				},
				{ description: "Unauthorized" },
			),
		},
	},
);
