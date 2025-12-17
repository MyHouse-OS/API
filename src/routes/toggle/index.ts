import { Elysia } from "elysia";
import { doorRoutes } from "./door";
import { heatRoutes } from "./heat";
import { lightRoutes } from "./light";

export const toggleRoutes = new Elysia()
	.group("/light", (app) => app.use(lightRoutes))
	.group("/door", (app) => app.use(doorRoutes))
	.group("/heat", (app) => app.use(heatRoutes));
