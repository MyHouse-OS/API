import { Elysia } from "elysia";

export const tempRoutes = new Elysia()
	.get("/", () => ({
		message: "Get temperature",
		status: "OK",
	}))
	.post("/", () => ({
		message: "Set temperature",
		status: "OK",
	}));
