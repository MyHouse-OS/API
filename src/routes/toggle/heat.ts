import { Elysia } from "elysia";

export const heatRoutes = new Elysia()
	.get("/", () => ({
		message: "Get heat status",
		status: "OK",
	}))
	.post("/", () => ({
		message: "Toggle heat",
		status: "OK",
	}));
