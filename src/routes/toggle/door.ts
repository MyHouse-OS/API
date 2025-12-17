import { Elysia } from "elysia";

export const doorRoutes = new Elysia()
	.get("/", () => ({
		message: "Get door status",
		status: "OK",
	}))
	.post("/", () => ({
		message: "Toggle door",
		status: "OK",
	}));
