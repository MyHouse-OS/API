import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import figlet from "figlet";
import { routes } from "./src/routes";
import { initRuleEngine } from "./src/rules/engine";
import { EVENTS, eventBus } from "./src/utils/eventBus";

export const app = new Elysia()
	.use(cors())
	.use(
		swagger({
			documentation: {
				info: {
					title: "MyHouse OS",
					version: "1.0.0",
				},
			},
			path: "/swagger",
		}),
	)
	.get("/", () => {
		const banner = figlet.textSync("MyHouse OS", { font: "Ghost" });
		return new Response(banner);
	})
	.use(routes);

eventBus.on(EVENTS.STATE_CHANGE, (data) => {
	app.server?.publish("home-updates", JSON.stringify({ type: "UPDATE", data }));
});

eventBus.on(EVENTS.NEW_CONNECTION, () => {
	console.log("New WS connection established");
});

if (import.meta.main) {
	initRuleEngine();

	app.listen(3000);
	console.log("🦊 Server → http://localhost:3000");
	console.log("📖 Swagger → http://localhost:3000/swagger");
}
