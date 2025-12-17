import { Elysia } from "elysia";
import { tempRoutes } from "./temp";
import { toggleRoutes } from "./toggle";
import { authRoutes } from "./auth";

export const routes = new Elysia()
	.group("/temp", { detail: { tags: ["Temperature"] } }, (app) =>
		app.use(tempRoutes),
	)
	.group("/toggle", { detail: { tags: ["Toggle"] } }, (app) =>
		app.use(toggleRoutes),
	)
	.group("/auth", { detail: { tags: ["Authentication"] } }, (app) =>
		app.use(authRoutes),
	);
