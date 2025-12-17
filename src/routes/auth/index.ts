import { Elysia } from "elysia";

export const authRoutes = new Elysia()
	.get("/", () => ({
		message: "Get auth status",
		status: "OK",
	}))
	.post("/", () => ({
		message: "Authenticate",
		status: "OK",
	}));
