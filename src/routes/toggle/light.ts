import { Elysia } from "elysia";

export const lightRoutes = new Elysia()
	.get("/", () => ({
		message: "Get light status",
		status: "OK",
	}))
	.post("/", () => ({
		message: "Toggle light",
		status: "OK",
	}));
