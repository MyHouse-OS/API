import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { routes } from "./src/routes";

export const app = new Elysia()
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
	.use(routes)
	.listen(3000);

console.log("🦊 serveur → http://localhost:3000");
console.log("📖 swagger UI → http://localhost:3000/swagger");
