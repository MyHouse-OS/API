import { Elysia, t } from "elysia";

export const authRoutes = new Elysia().post(
	"/",
	async ({ headers, body, set }) => {
		console.log("New authentication request received");

		const authorization = headers.authorization;

		if (!authorization) {
			set.status = 401;
			return {
				error: "Authorization header missing",
				status: "UNAUTHORIZED",
			};
		}

		if (!authorization.includes(":")) {
			set.status = 401;
			return {
				error: "Invalid authorization format",
				status: "UNAUTHORIZED",
			};
		}

		const [headerId, headerToken] = authorization.split(":");

		if (!body) {
			set.status = 400;
			return {
				error: "Body is required",
				status: "BAD_REQUEST",
			};
		}

		const { id, token } = body;

		if (!id || id.trim() === "") {
			set.status = 400;
			return {
				error: "Id is required",
				status: "BAD_REQUEST",
			};
		}

		if (!token || token.trim() === "") {
			set.status = 400;
			return {
				error: "Token is required",
				status: "BAD_REQUEST",
			};
		}

		return {
			status: "OK",
		};
	},
	{
		headers: t.Object({
			authorization: t.String({
				description: "Format: id:token",
				example: "espServer:XXXXYYYYZZZZ",
			}),
		}),

		body: t.Object({
			id: t.String({
				example: "espClient01",
			}),
			token: t.String({
				example: "AAAABBBBCCCC",
			}),
		}),

		response: {
			200: t.Object({
				status: t.String({ example: "OK" }),
			}),
			400: t.Object({
				error: t.String({ example: "Id is required" }),
				status: t.String(),
			}),
			401: t.Object({
				error: t.String({ example: "Authorization header missing" }),
				status: t.String(),
			}),
		},

		detail: {
			summary: "Authentication endpoint",
			description:
				"This endpoint is used by an ESP server to authenticate and request the creation of a new ESP client account by sending the client's future identifiers in the request body.",
			tags: ["Auth"],
		},
	},
);
