import { Elysia } from "elysia";
import { authMiddleware } from "../middleware/auth";
import { authRoutes } from "./auth";
import { checkRoutes } from "./check";
import { historyRoutes } from "./history";
import { statusRoutes } from "./status";
import { tempRoutes } from "./temp";
import { toggleRoutes } from "./toggle";
import { wsRoutes } from "./ws";

export const routes = new Elysia()
	.group("/status", { detail: { tags: ["System"] } }, (app) => app.use(statusRoutes))
	.use(wsRoutes)
	.use(authMiddleware)
	.group("/check", { detail: { tags: ["Check"] } }, (app) => app.use(checkRoutes))
	.group("/history", { detail: { tags: ["History"] } }, (app) => app.use(historyRoutes))
	.group("/temp", { detail: { tags: ["Temperature"] } }, (app) => app.use(tempRoutes))
	.group("/toggle", { detail: { tags: ["Toggle"] } }, (app) => app.use(toggleRoutes))
	.group("/auth", { detail: { tags: ["Authentication"] } }, (app) => app.use(authRoutes));
