import { Elysia, t } from "elysia";
import { prisma } from "../../../prisma/db";
import { encrypt } from "../../utils/crypto";

export const authRoutes = new Elysia().post(
	"/",
	async ({ body, set }) => {
		console.log("New client registration request from Master Server");

		const { id, token } = body;

		try {
			const encryptedToken = encrypt(token);

			const newClient = await prisma.client.upsert({
				where: { ClientID: id },
				update: { ClientToken: encryptedToken },
				create: {
					ClientID: id,
					ClientToken: encryptedToken,
				},
			});

			console.log(`New client registered/updated: ${id}`);
			return {
				status: "OK",
				message: `Client ${id} registered successfully`,
				client: newClient.ClientID,
			};
		} catch (error) {
			console.error("Failed to register client:", error);
			set.status = 500;
			return { error: "Database error", status: "SERVER_ERROR" };
		}
	},
	{
		detail: {
			summary: "Register a New Client",
			description:
				"Allows an authenticated Master Server (via Authorization header) to register or update credentials for a new ESP client in the database.",
			tags: ["Authentication"],
		},
		headers: t.Object({
			authorization: t.String({
				description: "Master Credentials. Format: 'MasterID:MasterToken'",
				example: "MasterServer:SecretKey123",
			}),
		}),
		body: t.Object({
			id: t.String({
				description: "Unique Identifier for the new client (ESP)",
				example: "LivingRoomESP",
			}),
			token: t.String({
				description: "Secret access token for the new client",
				example: "a1b2c3d4e5f6",
			}),
		}),
		response: {
			200: t.Object(
				{
					status: t.String({ example: "OK", description: "Request was successful" }),
					message: t.String({
						example: "Client LivingRoomESP registered successfully",
						description: "Success message",
					}),
					client: t.String({
						example: "LivingRoomESP",
						description: "Registered client identifier",
					}),
				},
				{ description: "Client registered successfully" },
			),
			401: t.Object(
				{
					error: t.String({
						example: "Invalid credentials",
						description: "Error message indicating authentication failure",
					}),
					status: t.String({ example: "UNAUTHORIZED", description: "Authentication status" }),
				},
				{ description: "Master Server authentication failed" },
			),
			500: t.Object(
				{
					error: t.String({ description: "Error message indicating internal server error" }),
					status: t.String({ description: "Error status" }),
				},
				{ description: "Internal Database Error" },
			),
		},
	},
);
