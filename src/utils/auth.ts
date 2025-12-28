import { prisma } from "../../prisma/db";
import { decrypt } from "./crypto";

export interface AuthResult {
	valid: boolean;
	clientId?: string;
	error?: string;
}

export async function verifyClientAuth(authorization: string | null): Promise<AuthResult> {
	if (!authorization) {
		return { valid: false, error: "Authorization header missing" };
	}

	if (!authorization.includes(":")) {
		return { valid: false, error: "Invalid authorization format. Expected 'id:token'" };
	}

	const [clientId, clientToken] = authorization.split(":");

	if (!clientId || !clientToken) {
		return { valid: false, error: "Invalid credentials format" };
	}

	const client = await prisma.client.findUnique({
		where: { ClientID: clientId },
	});

	if (!client) {
		console.log(`Unauthorized access attempt by unknown client: ${clientId}`);
		return { valid: false, error: "Invalid credentials" };
	}

	try {
		const decryptedToken = decrypt(client.ClientToken);
		if (decryptedToken !== clientToken) {
			console.log(`Invalid token provided for client: ${clientId}`);
			return { valid: false, error: "Invalid credentials" };
		}
	} catch (error) {
		console.error(`Token verification failed for ${clientId}:`, error);
		return { valid: false, error: "Invalid credentials" };
	}

	return { valid: true, clientId };
}
