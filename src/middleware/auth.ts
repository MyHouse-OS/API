import type { Elysia } from "elysia";
import { prisma } from "../../prisma/db";
import { decrypt } from "../utils/crypto";

export const authMiddleware = (app: Elysia) =>
	app.derive(async ({ headers, set }) => {
		const authorization = headers.authorization;

		if (!authorization) {
			set.status = 401;
			throw new Error("Authorization header missing");
		}

		if (!authorization.includes(":")) {
			set.status = 401;
			throw new Error("Invalid authorization format. Expected 'id:token'");
		}

		const [clientId, clientToken] = authorization.split(":");

		if (!clientId || !clientToken) {
			set.status = 401;
			throw new Error("Invalid credentials format");
		}

		const client = await prisma.client.findUnique({
			where: {
				ClientID: clientId,
			},
		});

		if (!client) {
			console.log(`Unauthorized access attempt by unknown client: ${clientId}`);
			set.status = 401;
			throw new Error("Invalid credentials");
		}

		try {
			const decryptedToken = decrypt(client.ClientToken);
			if (decryptedToken !== clientToken) {
				console.log(`Invalid token provided for client: ${clientId}`);
				set.status = 401;
				throw new Error("Invalid credentials");
			}
		} catch (error) {
			console.error(`Token verification failed for ${clientId}:`, error);
			set.status = 401;
			throw new Error("Invalid credentials");
		}

		return {
			user: client,
		};
	});
