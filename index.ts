import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import figlet from "figlet";
import { startMcpServer } from "./src/mcp/server";
import { routes } from "./src/routes";
import { initRuleEngine } from "./src/rules/engine";
import { EVENTS, eventBus } from "./src/utils/eventBus";

export const app = new Elysia()
	.use(
		cors({
			origin: true,
			methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
			allowedHeaders: ["Content-Type", "Authorization"],
		}),
	)
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
	startMcpServer();

	const PORT_BUN_SERVER = process.env.PORT_BUN_SERVER || 3000;
	const PORT_WEB_SERVER = process.env.PORT_WEB_SERVER || 8080;
	const PORT_MCP_SERVER = process.env.MCP_PORT || 3001;
	app.listen(PORT_BUN_SERVER);

	console.log(`
┌────────────────────────────────────────────────────┐
│  MyHouse OS Server is running                      │
│                                                    │
│  🚀 Server:     http://192.168.4.1                 │
│  🔗 API:        http://192.168.4.2:${PORT_BUN_SERVER}            │
│  📖 Swagger:    http://192.168.4.2:${PORT_BUN_SERVER}/swagger    │
│  🔌 WebSocket:  ws://192.168.4.2:${PORT_BUN_SERVER}/ws           │
│  🤖 MCP:        http://192.168.4.2:${PORT_MCP_SERVER}/mcp        │
│  🌐 Web Server: http://192.168.4.3:${PORT_WEB_SERVER}            │
└────────────────────────────────────────────────────┘
	`);
}
